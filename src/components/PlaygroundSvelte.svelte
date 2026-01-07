<script lang="ts">
  import { initWasm, compile, isWasmReady } from '../lib/compiler';
  import { createFerretRuntime } from '../lib/runtime';
  import { onMount } from 'svelte';
  //import * as monaco from "monaco-editor";
  import FileTabs from './playground/FileTabs.svelte';
  import Editor from './playground/Editor.svelte';
  import OutputPanel from './playground/OutputPanel.svelte';
  import Modal, { showAlert, showConfirm } from './Modal.svelte';
  import { base64EncodeUnicode, base64DecodeUnicode } from '../lib/base64';

  interface TerminalEvent {
    type: "output" | "input" | "system";
    text?: string;
    html?: string;
  }

  // State management using Svelte 5 runes
  let files = $state<Record<string, any>>({});
  let activeFile = $state("main.fer");
  let cursorPosition = $state({ line: 1, column: 1 });
  let compilerVersion = $state("Loading...");
  
  // Terminal state
  let terminalEvents = $state<TerminalEvent[]>([]);
  let runState = $state<"idle" | "running" | "waiting">("idle");
  let status = $state<"loading" | "ready" | "running" | "input" | "success" | "error">("loading");
  let statusText = $state("Loading...");
  let inputLines = $state<string[]>([]);
  let runToken = $state(0);
  let activeRunToken = $state(0);
  let cachedRun = $state<{ code: string; wasm: string; compilerLog: string } | null>(null);

  // Derived state
  let activeModel = $derived(files[activeFile]);
  let isRunning = $derived(runState === "running" || runState === "waiting");
  let isWaitingInput = $derived(runState === "waiting");

  // Default code
  const DEFAULT_CODE = `fn main() {
    let name := "Ferret";
    print("Hello from " + name + "!");
}`;

  // Initialize WASM and load files
  onMount(() => {
    // Listen for escape key to abort
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRunning) {
        abortRun("✗ Execution aborted by user.");
      }
    };
    document.addEventListener("keydown", handleEscape);

    (async () => {
      // Load default code from file
      let defaultCode = DEFAULT_CODE;
      try {
        const response = await fetch("/examples/default.fer");
        if (response.ok) {
          defaultCode = await response.text();
        }
      } catch (error) {
        console.error("Error loading default code:", error);
      }

      // Check for files in URL
      const urlParams = new URLSearchParams(window.location.search);
      const filesParam = urlParams.get("files");

      let filesLoaded = false;

      if (filesParam) {
        try {
          const filesData = JSON.parse(base64DecodeUnicode(filesParam));
          loadFilesFromData(filesData);
          filesLoaded = true;
        } catch (e) {
          console.error("Failed to load files from URL:", e);
        }
      }

      if (!filesLoaded) {
        filesLoaded = loadFromLocalStorage();
      }

      if (!filesLoaded) {
        createFile("main.fer", defaultCode);
      }

      // Initialize WASM
      const result = await initWasm();
      if (result.success) {
        compilerVersion = result.version || "unknown";
        status = "ready";
        statusText = "Ready";
      } else {
        status = "error";
        statusText = "Error";
        terminalEvents = [{
          type: "system",
          html: `<p style="color: #ef4444;">Failed to load compiler: ${escapeHtml(result.error || "Unknown error")}</p><p style="color: #6b7280; font-size: 0.75rem; margin-top: 0.5rem;">Please refresh the page to try again.</p>`,
        }];
      }
    })();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Dispose all models
      Object.values(files).forEach(model => model.dispose());
    };
  });


  // File management functions
  async function createFile(name: string, content: string = "") {
    if (typeof window === 'undefined'){
      return;
    }
    const monaco = await import("monaco-editor");
    const uri = monaco.Uri.parse(`file:///${name}`);
    const model = monaco.editor.createModel(content, "ferret", uri);
    files[name] = model;
    saveToLocalStorage();
  }

  function switchFile(name: string) {
    if (files[name]) {
      activeFile = name;
      saveToLocalStorage();
    }
  }

  function addFile(name: string) {
    if (!files[name]) {
      createFile(name, "");
      activeFile = name;
    }
  }

  function removeFile(name: string) {
    if (name === "main.fer" || !files[name]) return;
    
    files[name].dispose();
    delete files[name];
    
    if (activeFile === name) {
      activeFile = "main.fer";
    }
    
    saveToLocalStorage();
  }

  function loadFilesFromData(filesData: Record<string, string>) {
    // Clear existing files
    Object.values(files).forEach(model => model.dispose());
    files = {};
    
    // Load new files
    for (const [name, content] of Object.entries(filesData)) {
      createFile(name, content);
    }
    
    // Switch to main.fer or first file
    const firstFile = filesData["main.fer"] ? "main.fer" : Object.keys(filesData)[0];
    if (firstFile) {
      activeFile = firstFile;
    }
  }

  function saveToLocalStorage() {
    const data: Record<string, string> = {};
    for (const [name, model] of Object.entries(files)) {
      data[name] = model.getValue();
    }
    localStorage.setItem("ferret-playground-files", JSON.stringify(data));
    localStorage.setItem("ferret-playground-active", activeFile);
  }

  function loadFromLocalStorage(): boolean {
    const savedFiles = localStorage.getItem("ferret-playground-files");
    const savedActive = localStorage.getItem("ferret-playground-active");
    
    if (!savedFiles) return false;
    
    try {
      const filesData = JSON.parse(savedFiles);
      loadFilesFromData(filesData);
      if (savedActive && files[savedActive]) {
        activeFile = savedActive;
      }
      return true;
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
      return false;
    }
  }

  // Compilation and execution
  function decodeBase64(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isInputNeeded(error: unknown): boolean {
    return error instanceof Error && (error as any).code === "FERRET_INPUT";
  }

  function buildCompilerEvents(compilerLog: string): TerminalEvent[] {
    if (!compilerLog) return [];
    return [{
      type: "system" as const,
      html: `<div class="compiler-log">${compilerLog}</div>`,
    }];
  }

  function abortRun(message: string) {
    runToken += 1;
    activeRunToken = 0;
    runState = "idle";
    inputLines = [];
    cachedRun = null;
    status = "ready";
    statusText = "Ready";
    if (message) {
      terminalEvents = [...terminalEvents, { type: "system", text: message }];
    }
  }

  async function runWithInputs(token: number) {
    if (!cachedRun || token === 0 || token !== runToken) {
      return;
    }

    const baseEvents = buildCompilerEvents(cachedRun.compilerLog);
    const events: TerminalEvent[] = [];
    const runtime = createFerretRuntime({
      onPrint: () => {},
      onEvent: (event) => {
        events.push(event);
      },
      input: inputLines.join("\n"),
      throwOnInputNeeded: true,
    });

    try {
      const programBytes = decodeBase64(cachedRun.wasm) as BufferSource;
      const program = await WebAssembly.instantiate(programBytes, runtime.imports);
      
      if (token !== runToken) return;
      
      runtime.bind(program.instance);
      const main = (program.instance.exports as any).main;
      if (typeof main === "function") {
        main();
      }
      
      if (token !== runToken) return;

      terminalEvents = baseEvents.concat(events);
      if (!terminalEvents.some((event) => event.type === "output")) {
        terminalEvents.push({
          type: "system",
          html: `<p style="color: #6b7280; font-size: 0.75rem;">No output produced.</p>`,
        });
      }

      terminalEvents.push({
        type: "system",
        html: `<p style="color: #10b981;">Program executed successfully with exit status 0.</p>`,
      });

      status = "success";
      statusText = "Success";
      runState = "idle";
      activeRunToken = 0;
    } catch (runError) {
      if (token !== runToken) return;
      
      if (isInputNeeded(runError)) {
        terminalEvents = baseEvents.concat(events);
        runState = "waiting";
        status = "input";
        statusText = "Waiting for input...";
        return;
      }

      status = "error";
      statusText = "Error";
      const runMessage = runError instanceof Error ? runError.message : String(runError);
      terminalEvents = [
        ...baseEvents,
        ...events,
        {
          type: "system",
          html: `<p style="color: #ef4444;">Runtime error: ${escapeHtml(runMessage)}</p>`,
        },
      ];
      runState = "idle";
      activeRunToken = 0;
    } finally {
      if (token !== runToken) return;
      if (runState === "idle") {
        inputLines = [];
        cachedRun = null;
      }
    }
  }

  async function handleRun() {
    if (isRunning) {
      abortRun("✗ Execution aborted by user.");
      return;
    }

    // Get all files
    const allFiles: Record<string, string> = {};
    for (const [name, model] of Object.entries(files)) {
      allFiles[name] = model.getValue();
    }

    if (!isWasmReady()) {
      status = "error";
      statusText = "Loading...";
      terminalEvents = [{
        type: "system",
        html: `<p style="color: #f59e0b;">⚠️ Compiler is still loading. Please wait...</p>`,
      }];
      return;
    }

    runState = "running";
    runToken += 1;
    activeRunToken = runToken;
    inputLines = [];

    status = "running";
    statusText = "Running...";
    terminalEvents = [{
      type: "system",
      text: "⏳ Compiling and running your code...",
    }];

    try {
      const result = compile(allFiles, false);

      if (result.success && result.wasm) {
        cachedRun = {
          code: JSON.stringify(allFiles),
          wasm: result.wasm,
          compilerLog: result.output || "",
        };
        await runWithInputs(activeRunToken);
      } else {
        status = "error";
        statusText = "Error";
        terminalEvents = [{
          type: "system",
          html: `<div class="compiler-log">${result.error || result.output || "Compilation failed"}</div>`,
        }];
        runState = "idle";
        activeRunToken = 0;
      }
    } catch (error) {
      console.error("Compilation exception:", error);
      status = "error";
      statusText = "Error";
      terminalEvents = [{
        type: "system",
        html: `<p style="color: #ef4444;">Compiler error: ${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`,
      }];
      runState = "idle";
      activeRunToken = 0;
    }
  }

  function handleInput(value: string) {
    if (runState !== "waiting" || !cachedRun) return;
    
    inputLines.push(value);
    runState = "running";
    status = "running";
    statusText = "Running...";
    
    if (activeRunToken !== 0) {
      runWithInputs(activeRunToken);
    }
  }

  function handleCursorChange(line: number, column: number) {
    cursorPosition = { line, column };
  }

  // Action handlers
  async function handleShare() {
    const allFiles: Record<string, string> = {};
    for (const [name, model] of Object.entries(files)) {
      allFiles[name] = model.getValue();
    }
    const filesJson = JSON.stringify(allFiles);
    const filesBase64 = base64EncodeUnicode(filesJson);
    const shareUrl = `${window.location.origin}${window.location.pathname}?files=${filesBase64}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAlert("Link copied to clipboard!");
    } catch {
      showAlert("Could not copy, copy manually:", { selectableContent: true, selectableText: shareUrl });
    }
  }

  function handleCopy() {
    if (!activeModel) return;
    const code = activeModel.getValue();
    navigator.clipboard.writeText(code);
  }

  function handleExport() {
    const allFiles: Record<string, string> = {};
    for (const [name, model] of Object.entries(files)) {
      allFiles[name] = model.getValue();
    }
    
    const fileCount = Object.keys(allFiles).length;
    
    if (fileCount === 1) {
      const fileName = Object.keys(allFiles)[0];
      const code = allFiles[fileName];
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(allFiles, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ferret-project.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleClear() {
    const confirmed = await showConfirm("Are you sure you want to clear all files?");
    if (confirmed) {
      loadFilesFromData({ "main.fer": "" });
      terminalEvents = [{
        type: "system",
        text: "All files cleared.",
      }];
      inputLines = [];
      cachedRun = null;
      runState = "idle";
      activeRunToken = 0;
      status = "ready";
      statusText = "Ready";
    }
  }
</script>

<Modal />

<div class="playground-container">
  <!-- Header with macOS-style dots and actions -->
  <div class="playground-header">
    <div class="header-left">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <FileTabs
        {files}
        {activeFile}
        onFileSwitch={switchFile}
        onFileAdd={addFile}
        onFileRemove={removeFile}
      />
    </div>
    <div class="playground-actions">
      <button class="icon-button" onclick={handleShare} title="Share Code">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>
      <button class="icon-button" onclick={handleCopy} title="Copy Code">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>
      <button class="icon-button" onclick={handleExport} title="Export Code">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Export</span>
      </button>
      <button class="icon-button" onclick={handleClear} title="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Clear</span>
      </button>
      <button
        class="icon-button run-button"
        class:run-button-abort={isRunning}
        onclick={handleRun}
        title={isRunning ? "Abort (Esc)" : "Run Code (Ctrl+Enter)"}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          {#if isRunning}
            <path d="M6 6h12v12H6z"></path>
          {:else}
            <path d="M8 5v14l11-7z"></path>
          {/if}
        </svg>
        <span>{isRunning ? "Abort" : "Run"}</span>
      </button>
    </div>
  </div>

  <!-- Main content area with resizable panels -->
  <div class="playground-content">
    <div class="editor-panel">
      {#if activeModel}
        <Editor
          model={activeModel}
          onCursorChange={handleCursorChange}
          onRun={handleRun}
        />
      {/if}
      <div class="editor-footer">
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>UTF-8</span>
        <span>Ferret</span>
      </div>
    </div>

    <!-- Resize handle (desktop only) -->
    <div class="resize-handle">
      <div class="resize-handle-bar"></div>
    </div>

    <OutputPanel
      events={terminalEvents}
      {status}
      {statusText}
      {isWaitingInput}
      onInput={handleInput}
      version={compilerVersion}
    />
  </div>
</div>

<style>
  .playground-container {
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 10px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  :global([data-theme="dark"]) .playground-container {
    background: var(--editor-bg, #282C34);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.3),
      0 10px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .playground-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 1.25rem;
    background: #f7f7f7;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  :global([data-theme="dark"]) .playground-header {
    background: var(--editor-bg, #282C34);
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .window-dots {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .dot-red {
    background: #ff5f57;
  }

  .dot-yellow {
    background: #ffbd2e;
  }

  .dot-green {
    background: #28ca42;
  }

  .playground-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    background: transparent;
    border: none;
    border-radius: 24px;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .icon-button {
    color: #9ca3af;
  }

  .icon-button svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="dark"]) .icon-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .run-button {
    background: #000000;
    color: #ffffff;
  }

  .run-button:hover {
    background: var(--accent-color, #4f46e5) !important;
    color: #ffffff !important;
  }

  .run-button-abort {
    background: #ef4444 !important;
    color: #ffffff !important;
  }

  .run-button-abort:hover {
    background: #dc2626 !important;
  }

  :global([data-theme="dark"]) .run-button {
    background: #ffffff;
    color: #000000;
  }

  :global([data-theme="dark"]) .run-button-abort {
    background: #f87171 !important;
    color: #111111 !important;
  }

  .playground-content {
    display: flex;
    flex-direction: row;
    height: 100%;
    min-height: 400px;
    position: relative;
  }

  .editor-panel {
    flex: 0 0 calc(60% - 4px);
    min-width: 400px;
    position: relative;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global([data-theme="dark"]) .editor-panel {
    background: var(--editor-bg, #282C34);
  }

  .editor-footer {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.6875rem;
    color: #9ca3af;
    background: rgba(0, 0, 0, 0.02);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    margin-top: auto;
  }

  :global([data-theme="dark"]) .editor-footer {
    color: #6b7280;
    background: var(--editor-bg, #282C34);
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .resize-handle {
    width: 8px;
    background: rgba(0, 0, 0, 0.05);
    cursor: col-resize;
    position: relative;
    flex-shrink: 0;
    transition: background 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global([data-theme="dark"]) .resize-handle {
    background: rgba(255, 255, 255, 0.05);
  }

  .resize-handle:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  :global([data-theme="dark"]) .resize-handle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .resize-handle-bar {
    width: 2px;
    height: 48px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 1px;
  }

  :global([data-theme="dark"]) .resize-handle-bar {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Responsive - Mobile: Stack vertically */
  @media (max-width: 768px) {
    .playground-container {
      margin: 1rem 0;
      border-radius: 12px;
    }

    .playground-header {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }

    .header-left {
      width: 100%;
      flex-wrap: wrap;
    }

    .playground-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .icon-button span {
      display: none;
    }

    .playground-content {
      flex-direction: column;
      min-height: 600px;
    }

    .editor-panel {
      flex: 0 0 50%;
      min-width: 100%;
    }

    .resize-handle {
      display: none;
    }
  }
</style>
