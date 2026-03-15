/**
 * Compiler types and WASM initialization
 */

import "./wasm_exec.js";

export interface CompileResult {
    success: boolean;
    output?: string;
    error?: string;
    wasm?: string;
}

export interface RunWasmResult {
    success: boolean;
    exitCode?: number;
    error?: string;
    missingImports?: string[];
}

export interface FerretCompiler {
    compile: (files: Record<string, string> | string, debug: boolean) => CompileResult;
    version?: string;
}

declare global {
    interface Window {
        ferretCompile?: (code: string | Record<string, string>, debug: boolean) => CompileResult;
        ferretWasmVersion?: string;
    }
    class Go {
        importObject: any;
        run(instance: WebAssembly.Instance): Promise<void>;
    }
}

let wasmReady = false;

function isLegacyCompilerVersion(version: string): boolean {
    const v = version.trim().toLowerCase();
    return v === "0.0.8" || v.startsWith("0.0.8-");
}

export function isWasmReady(): boolean {
    return wasmReady;
}

export async function initWasm(): Promise<{ success: boolean; error?: string; version?: string }> {
    try {
        console.log("🔄 Loading Ferret WASM compiler...");

        const go = new Go();

        // Clear any service worker cache
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }

        console.log("📥 Fetching ferret2.wasm...");
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const response = await fetch("/ferret2.wasm?v=" + encodeURIComponent(cacheBuster), {
            cache: "no-store", // Force no cache
        });
        
        if (!response.ok) {
            throw new Error(
                `Failed to fetch WASM file: ${response.status} ${response.statusText}`
            );
        }

        console.log("📦 Instantiating WASM module...");
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, go.importObject);

        console.log("▶️ Running Go program...");
        // Run the Go program in background (don't await it, it runs forever)
        go.run(result.instance);

        // Wait a bit for Go to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if ferretCompile function is available
        if (typeof window.ferretCompile === "function") {
            const version = window.ferretWasmVersion || "unknown";
            if (isLegacyCompilerVersion(version)) {
                wasmReady = false;
                return {
                    success: false,
                    error: `Loaded legacy playground compiler version ${version}. Please replace website/public/ferret2.wasm with the new compiler wasm build.`,
                    version,
                };
            }

            wasmReady = true;
            console.log("✅ Ferret WASM compiler loaded successfully!");
            console.log("📌 WASM Version:", version);
            return { success: true, version };
        } else {
            throw new Error(
                "ferretCompile function not found after WASM initialization"
            );
        }
    } catch (error) {
        console.error("❌ Failed to load WASM:", error);
        console.error("Error details:", (error as Error).stack);
        wasmReady = false;
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export function compile(files: Record<string, string>, debug: boolean = false): CompileResult {
    if (!wasmReady || typeof window.ferretCompile !== "function") {
        return {
            success: false,
            error: "WASM compiler not ready",
        };
    }

    const normalizedFiles: Record<string, string> = { ...files };
    if (normalizedFiles["main.ferr"] && !normalizedFiles["main.fer"]) {
        normalizedFiles["main.fer"] = normalizedFiles["main.ferr"];
    }
    if (normalizedFiles["main.fer"] && !normalizedFiles["main.ferr"]) {
        normalizedFiles["main.ferr"] = normalizedFiles["main.fer"];
    }

    return window.ferretCompile(normalizedFiles, debug);
}

export async function runCompiledWasmSelfContained(base64Wasm: string): Promise<RunWasmResult> {
    try {
        const bytes = Uint8Array.from(atob(base64Wasm), (c) => c.charCodeAt(0));
        const module = await WebAssembly.compile(bytes);
        const imports = WebAssembly.Module.imports(module);

        if (imports.length > 0) {
            const missingImports = imports.map((entry) => `${entry.module}.${entry.name}`);
            return {
                success: false,
                error: "Program is not self-contained yet (requires host/runtime imports).",
                missingImports,
            };
        }

        const instance = await WebAssembly.instantiate(module, {});
        const exports = instance.exports as Record<string, unknown>;
        const main = exports.main;

        if (typeof main !== "function") {
            return {
                success: false,
                error: "Compiled module has no exported main function.",
            };
        }

        const result = (main as () => unknown)();
        const exitCode = typeof result === "number" ? (result | 0) : 0;

        if (exitCode !== 0) {
            return {
                success: false,
                exitCode,
                error: `Program exited with status ${exitCode}.`,
            };
        }

        return {
            success: true,
            exitCode: 0,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
