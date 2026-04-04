/**
 * Compiler types and WASM initialization
 */

import "./wasm_exec.js";

export interface CompileResult {
    success: boolean;
    output?: string;
    error?: string;
    artifact?: string;
    artifactKind?: string;
    artifactExt?: string;
    diagnosticsHtml?: string;
    diagnostics?: CompileDiagnostic[];
}

export interface CompileDiagnostic {
    severity: string;
    code?: string;
    message: string;
    file?: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
}

export interface RunWasmResult {
    success: boolean;
    exitCode?: number;
    error?: string;
    stdout?: string;
    stderr?: string;
}

export interface FerretCompiler {
    compile: (files: Record<string, string> | string, debug: boolean) => CompileResult;
    version?: string;
}

declare global {
    interface Window {
        ferretCompile?: (code: string | Record<string, string>, debug: boolean) => CompileResult;
        ferretRunWasm?: (artifact: Uint8Array | string) => RunWasmResult;
        ferretAnsiToHtml?: (text: string) => string;
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

        if (
            typeof window.ferretCompile === "function" &&
            typeof window.ferretRunWasm === "function" &&
            typeof window.ferretAnsiToHtml === "function"
        ) {
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
                "browser compiler entrypoint is incomplete after WASM initialization"
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

    return window.ferretCompile({ ...files }, debug);
}

export function isRunnableArtifact(result: Pick<CompileResult, "artifact" | "artifactKind">): boolean {
    return typeof result.artifact === "string" && result.artifact.length > 0 && isWasmArtifactKind(result.artifactKind);
}

export async function runCompiledArtifact(
    artifact: string,
    artifactKind?: string
): Promise<RunWasmResult> {
    if (!wasmReady || typeof window.ferretRunWasm !== "function") {
        return {
            success: false,
            error: "WASM runner not ready",
        };
    }

    if (!isWasmArtifactKind(artifactKind)) {
        return {
            success: false,
            error: `Browser compiler produced ${describeArtifact(artifactKind)}. Final wasm linking is not available in the playground yet.`,
        };
    }

    try {
        return window.ferretRunWasm(artifact);
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export function renderCompilerHtml(text: string): string {
    if (!wasmReady || typeof window.ferretAnsiToHtml !== "function") {
        return escapeHtml(text);
    }
    return window.ferretAnsiToHtml(text);
}

function isWasmArtifactKind(kind?: string): boolean {
    const normalized = (kind || "").trim().toLowerCase();
    return normalized === "wasm" || normalized === "application/wasm" || normalized === "wasm-base64";
}

function describeArtifact(kind?: string): string {
    const normalized = (kind || "").trim();
    return normalized !== "" ? `${normalized} artifact` : "a non-runnable compiler artifact";
}

function escapeHtml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}
