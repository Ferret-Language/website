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

        console.log("📥 Fetching ferret.wasm...");
        const wasmVersion = "wasm-backend-0.1"; // Browser WASM backend
        const response = await fetch("/ferret2.wasm?v=" + wasmVersion, {
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
            wasmReady = true;
            const version = window.ferretWasmVersion || "unknown";
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

    return window.ferretCompile(files, debug);
}
