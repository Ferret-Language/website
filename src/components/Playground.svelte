<script lang="ts">
  import { onMount, tick } from "svelte";
  import type * as monaco from "monaco-editor";

  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import { registerFerretLanguage, defineThemes, getCurrentTheme } from "../lib/monaco-config";
  import {
    initWasm,
    isWasmReady,
    compile,
    isRunnableArtifact,
    renderCompilerHtml,
    runCompiledArtifact,
  } from "../lib/compiler";
  import { base64EncodeUnicode, base64DecodeUnicode } from "../lib/base64";

  import Modal, { showAlert, showConfirm, showPrompt } from "./Modal.svelte";

  // -----------------------------
  // Types
  // -----------------------------
  type Status = "loading" | "ready" | "running" | "input" | "success" | "error";

  type TerminalEvent = {
    type: "output" | "input" | "system";
    text?: string;
    html?: string;
  };

  // -----------------------------
  // Monaco worker setup
  // -----------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };

  // -----------------------------
  // State
  // -----------------------------
  let monacoApi: typeof import("monaco-editor") | null = null;
  let editor: monaco.editor.IStandaloneCodeEditor | null = null;
  let themeObserver: MutationObserver | null = null;

  let editorContainer: HTMLDivElement | null = null;

  let files = $state<Record<string, monaco.editor.ITextModel>>({});
  let activeFile = $state("main.fer");
  let suppressSave = false;

  let cursorLine = $state(1);
  let cursorCol = $state(1);

  let status = $state<Status>("loading");
  let statusText = $state("Loading...");
  let compilerVersion = $state<string>("");

  let terminalEvents = $state<TerminalEvent[]>([]);
  let runState = $state<"idle" | "running" | "waiting">("idle");
  let inputValue = $state("");
  let inputLines = $state<string[]>([]);

  let runToken = $state(0); // Incremented each time a new run starts, used to cancel previous runs
  let activeRunToken = $state(0); // Tracks the token of the currently active run
  let cachedRun = $state<{ code: string; artifact: string; artifactKind?: string; compilerLog: string; compilerLogHtml?: string } | null>(null);
  let compilationCache = $state<Map<string, { artifact: string; artifactKind?: string; compilerLog: string; compilerLogHtml?: string }>>(new Map()); // Cache compilation results by code hash

  let activeModel = $derived(files[activeFile] ?? null);
  let isWaitingInput = $derived(runState === "waiting");
  let isRunning = $derived(runState === "running" || runState === "waiting");
  let hasOutput = $derived(terminalEvents.length > 0 && runState !== "idle" || terminalEvents.some(e => e.type === "output" || e.type === "system"));

  // Output log ref (for auto-scroll + inline prompt)
  let outputLogEl: HTMLDivElement | null = null;
  let inputEl: HTMLTextAreaElement | null = null;

  // Resize refs
  let playgroundContentEl: HTMLDivElement | null = null;
  let editorPanelEl: HTMLDivElement | null = null;
  let outputPanelEl: HTMLDivElement | null = null;
  let resizeHandleEl: HTMLDivElement | null = null;

  let isResizing = false;
  let startX = 0;
  let startEditorWidth = 0;
  let copySuccess = $state(false);

  const DEFAULT_CODE_FALLBACK = `fn main() {\n  return;\n}`;
  const defaultCodeRoute = "/examples/default.fer";


  // -----------------------------
  // Helpers
  // -----------------------------
  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Simple djb2 hash for caching
  function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash.toString();
  }

  function createModel(name: string, content: string): monaco.editor.ITextModel {
    if (!monacoApi) throw new Error("Monaco not ready");
    const uri = monacoApi.Uri.parse(`file:///${name}`);
    return monacoApi.editor.createModel(content, "ferret", uri);
  }

  function serializeFiles(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [name, model] of Object.entries(files)) {
      out[name] = model.getValue();
    }
    return out;
  }

  function normalizeProjectFiles(data: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [name, content] of Object.entries(data)) {
      const normalizedName = name.endsWith(".ferr") ? `${name.slice(0, -5)}.fer` : name;
      if (!(normalizedName in normalized)) {
        normalized[normalizedName] = content;
      }
    }
    return normalized;
  }

  function saveToLocalStorage() {
    if (suppressSave) return;
    localStorage.setItem("ferret-playground-files", JSON.stringify(serializeFiles()));
    localStorage.setItem("ferret-playground-active", activeFile);
  }

  function loadFromLocalStorage(): boolean {
    const savedFiles = localStorage.getItem("ferret-playground-files");
    const savedActive = localStorage.getItem("ferret-playground-active");
    if (!savedFiles) return false;

    try {
      const data = normalizeProjectFiles(JSON.parse(savedFiles) as Record<string, string>);
      loadFiles(data, { persist: false });
      const normalizedActive = savedActive?.endsWith(".ferr")
        ? `${savedActive.slice(0, -5)}.fer`
        : savedActive;
      if (normalizedActive && files[normalizedActive]) {
        activeFile = normalizedActive;
      }
      saveToLocalStorage();
      return true;
    } catch (e) {
      console.error("Failed to load files from localStorage:", e);
      return false;
    }
  }

  function loadFiles(data: Record<string, string>, opts: { persist?: boolean } = {}) {
    if (!monacoApi) return;

    const normalizedData = normalizeProjectFiles(data);

    suppressSave = true;

    // dispose old models
    for (const m of Object.values(files)) {
      try {
        m.dispose();
      } catch {
        // ignore
      }
    }

    const next: Record<string, monaco.editor.ITextModel> = {};
    for (const [name, content] of Object.entries(normalizedData)) {
      const model = createModel(name, content);
      next[name] = model;
      attachModelSave(model);
    }

    files = next;
    activeFile = normalizedData["main.fer"] ? "main.fer" : (Object.keys(normalizedData)[0] ?? "main.fer");

    // Immediately reflect active file in the editor (avoid relying on reactive effects)
    if (editor && files[activeFile]) {
      editor.setModel(files[activeFile]);
      queueMicrotask(() => editor?.layout());
    }

    suppressSave = false;

    if (opts.persist !== false) {
      saveToLocalStorage();
    }
  }

  function addFile(name: string, content = "// New file\n") {
    if (!monacoApi) return;
    if (!name.endsWith(".fer")) return;
    if (files[name]) return;

    const model = createModel(name, content);
    attachModelSave(model);

    files = { ...files, [name]: model };
    activeFile = name;

    // Switch Monaco immediately
    if (editor) {
      editor.setModel(model);
      queueMicrotask(() => editor?.layout());
    }

    saveToLocalStorage();
  }

  function removeFile(name: string) {
    if (name === "main.fer") return;
    const model = files[name];
    if (!model) return;

    model.dispose();
    const { [name]: _removed, ...rest } = files;
    files = rest;

    if (activeFile === name) {
      activeFile = files["main.fer"] ? "main.fer" : (Object.keys(files)[0] ?? "main.fer");
    }

    // Switch Monaco immediately to the new active model
    if (editor && files[activeFile]) {
      editor.setModel(files[activeFile]);
      queueMicrotask(() => editor?.layout());
    }

    saveToLocalStorage();
  }

  function switchFile(name: string) {
    const model = files[name];
    if (!model) return;

    activeFile = name;

    // Switch Monaco immediately (this is the critical fix)
    if (editor) {
      editor.setModel(model);
      queueMicrotask(() => editor?.layout());
    }

    saveToLocalStorage();
  }

  function renderEvent(ev: TerminalEvent): string {
    if (ev.html) return ev.html;
    if (ev.type === "input") {
      return `<div class="terminal-line terminal-input-line"><span class="terminal-prompt">></span><span class="terminal-text">${escapeHtml(ev.text || "")}</span></div>`;
    }
    if (ev.type === "system") {
      return renderTerminalBlock(ev.text || "", "terminal-system");
    }
    return renderTerminalBlock(ev.text || "", "terminal-output-line");
  }

  function buildCompilerEvents(log: string, logHtml?: string): TerminalEvent[] {
    if (!log && !logHtml) return [];
    if (logHtml) {
      return [{ type: "system", text: log || "Compiler output", html: `<div class="compiler-log">${logHtml}</div>` }];
    }
    return [{ type: "system", text: log, html: renderTerminalBlock(log, "compiler-log terminal-system") }];
  }

  function renderTerminalBlock(text: string, lineClass: string): string {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n");
    return lines
      .map((line) => {
        const html = renderCompilerHtml(line);
        return `<div class="terminal-line ${lineClass}"><span class="terminal-text">${html || "&nbsp;"}</span></div>`;
      })
      .join("");
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
    if (!cachedRun || token === 0 || token !== runToken) return;

    const baseEvents = buildCompilerEvents(cachedRun.compilerLog, cachedRun.compilerLogHtml);

    try {
      const runResult = await runCompiledArtifact(cachedRun.artifact, cachedRun.artifactKind);
      if (token !== runToken) return;

      if (runResult.success) {
        const outputEvents: TerminalEvent[] = [];
        if (runResult.stdout) {
          outputEvents.push({ type: "output", text: runResult.stdout });
        }
        if (runResult.stderr) {
          outputEvents.push({
            type: "system",
            text: runResult.stderr,
            html: `<pre class="compiler-log">${escapeHtml(runResult.stderr)}</pre>`,
          });
        }
        terminalEvents = baseEvents.concat(outputEvents, [
          {
            type: "system",
            text: "Program executed successfully with exit status 0.",
            html: `<p style="color: #10b981;">Program executed successfully with exit status 0.</p>`,
          },
        ]);
        status = "success";
        statusText = "Success";
      } else {
        const outputEvents: TerminalEvent[] = [];
        if (runResult.stdout) {
          outputEvents.push({ type: "output", text: runResult.stdout });
        }
        if (runResult.stderr) {
          outputEvents.push({
            type: "system",
            text: runResult.stderr,
            html: `<pre class="compiler-log">${escapeHtml(runResult.stderr)}</pre>`,
          });
        }
        terminalEvents = baseEvents.concat(outputEvents, [
          {
            type: "system",
            text: runResult.error || "Runtime error",
            html: `<pre class="compiler-log">${escapeHtml(runResult.error || "Runtime error")}</pre>`,
          },
          { type: "system", text: "Program executed unsuccessfully with exit status 1.", html: `<p style="color: #ef4444;">Program executed unsuccessfully with exit status 1.</p>` },
        ]);
        status = "error";
        statusText = "Error";
      }

      runState = "idle";
      activeRunToken = 0;
    } catch (err) {
      if (token !== runToken) return;

      status = "error";
      statusText = "Error";
      const msg = err instanceof Error ? err.message : String(err);
      terminalEvents = baseEvents.concat([
        { type: "system", text: `Runtime error: ${msg}`, html: `<p style="color: #ef4444;">Runtime error: ${escapeHtml(msg)}</p>` },
        { type: "system", text: "Program executed unsuccessfully with exit status 1.", html: `<p style="color: #ef4444;">Program executed unsuccessfully with exit status 1.</p>` },
      ]);

      runState = "idle";
      activeRunToken = 0;
    } finally {
      if (token !== runToken) return;
      if (runState === "idle") {
        setTimeout(() => {
          if (runState === "idle") {
            status = "ready";
            statusText = "Ready";
          }
        }, 2500);
      }
    }
  }

  async function handleRun() {
    if (isRunning) {
      abortRun("✗ Execution aborted by user.");
      return;
    }

    if (!isWasmReady()) {
      status = "error";
      statusText = "Loading...";
      terminalEvents = [
        {
          type: "system",
          html: '<p style="color: #f59e0b;">⏳ Loading compiler... Please wait a few seconds and try again.</p>',
        },
      ];
      return;
    }

    // Clear previous runtime state
    cachedRun = null;
    terminalEvents = [];
    inputLines = [];
    inputValue = "";

    runState = "running";
    runToken += 1;
    activeRunToken = runToken;

    status = "running";
    statusText = "Running...";

    terminalEvents = [{ type: "system", text: "⏳ Compiling and running your code..." }];

    try {
      const allFiles = serializeFiles();
      const codeStr = JSON.stringify(allFiles);
      const codeHash = hashString(codeStr);

      let compileResult = compilationCache.get(codeHash);
      if (!compileResult) {
        const result = compile(allFiles, false, { outputMode: "html" });
        if (result.success && result.artifact) {
          const compilerLog = (result.output || "").trim();
          const compilerLogHtml = result.diagnosticsHtml?.trim();
          compileResult = {
            artifact: result.artifact,
            artifactKind: result.artifactKind,
            compilerLog,
            compilerLogHtml,
          };
          compilationCache.set(codeHash, compileResult);
        } else {
          status = "error";
          statusText = "Error";
          const fallbackText = result.error || result.output || "Compilation failed";
          terminalEvents = result.diagnosticsHtml
            ? [
                { type: "system", text: fallbackText, html: `<div class="compiler-log">${result.diagnosticsHtml}</div>` },
                { type: "system", text: "Program executed unsuccessfully with exit status 1.", html: `<p style="color: #ef4444;">Program executed unsuccessfully with exit status 1.</p>` },
              ]
            : [
                { type: "system", text: fallbackText, html: `<pre class="compiler-log">${escapeHtml(fallbackText)}</pre>` },
                { type: "system", text: "Program executed unsuccessfully with exit status 1.", html: `<p style="color: #ef4444;">Program executed unsuccessfully with exit status 1.</p>` },
              ];
          runState = "idle";
          activeRunToken = 0;
          return;
        }
      }

      cachedRun = {
        code: codeStr,
        artifact: compileResult.artifact,
        artifactKind: compileResult.artifactKind,
        compilerLog: compileResult.compilerLog,
        compilerLogHtml: compileResult.compilerLogHtml,
      };

      if (!isRunnableArtifact(cachedRun)) {
        terminalEvents = buildCompilerEvents(cachedRun.compilerLog, cachedRun.compilerLogHtml).concat([
          {
            type: "system",
            text: `Compiled successfully, but the browser compiler returned ${cachedRun.artifactKind || "a non-runnable artifact"}. Final wasm linking is not available in the playground yet.`,
            html: `<pre class="compiler-log">${escapeHtml(`Compiled successfully, but the browser compiler returned ${cachedRun.artifactKind || "a non-runnable artifact"}. Final wasm linking is not available in the playground yet.`)}</pre>`,
          },
        ]);
        status = "error";
        statusText = "Error";
        runState = "idle";
        activeRunToken = 0;
        return;
      }

      await runWithInputs(activeRunToken);
    } catch (e) {
      status = "error";
      statusText = "Error";
      const errorMsg = e instanceof Error ? e.message : String(e);
      terminalEvents = [
        {
          type: "system",
          text: `Compiler error: ${errorMsg}`,
          html: `<p style="color: #ef4444;">Compiler error: ${escapeHtml(errorMsg)}</p>`,
        },
        { type: "system", text: "Program executed unsuccessfully with exit status 1.", html: `<p style="color: #ef4444;">Program executed unsuccessfully with exit status 1.</p>` },
      ];
      runState = "idle";
      activeRunToken = 0;
    }
  }

  async function handleSubmitInput() {
    if (!isWaitingInput || !cachedRun) return;

    const line = inputValue.replace(/\r?\n/g, "");
    inputValue = "";

    inputLines = [...inputLines, line];

    runState = "running";
    status = "running";
    statusText = "Running...";

    if (activeRunToken !== 0) {
      await runWithInputs(activeRunToken);
    }
  }

  // -----------------------------
  // UI actions
  // -----------------------------
  async function handleAddFile() {
    const name = await showPrompt("Enter file name (must end with .fer):", "e.g., utils.fer");
    if (!name) return;

    if (!name.endsWith(".fer")) {
      await showAlert("File name must end with .fer");
      return;
    }

    if (files[name]) {
      console.log("File already exists:", name);
      await showAlert("File already exists!");
      return;
    }

    addFile(name, "// New file\n");
  }

  async function handleCloseFile(name: string) {
    if (name === "main.fer") {
      await showAlert("Cannot remove main.fer");
      return;
    }
    const ok = await showConfirm(`Close ${name}?`);
    if (ok) removeFile(name);
  }

  async function handleShare() {
    const payload = base64EncodeUnicode(JSON.stringify(serializeFiles()));
    const url = `${window.location.origin}${window.location.pathname}?files=${payload}`;

    try {
      await navigator.clipboard.writeText(url);
      await showAlert("Share link copied to clipboard!");
    } catch {
      await showAlert("Could not copy, copy manually:", { selectableContent: true, selectableText: url });
    }
  }

  async function handleCopyActive() {
    if (!activeModel) return;
    await navigator.clipboard.writeText(activeModel.getValue());
    await showAlert("Copied current file!");
  }

  async function handleCopyOutput() {
    if (!outputLogEl) {
      return;
    }
    
    // Get the actual rendered text content from the DOM
    const textContent = outputLogEl.innerText || outputLogEl.textContent || '';
    
    if (!textContent.trim()) {
      return;
    }
    
    try {
      await navigator.clipboard.writeText(textContent);
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 1200);
    } catch {
      await showAlert("Failed to copy output");
    }
  }

  function handleExport() {
    const data = serializeFiles();
    const names = Object.keys(data);

    if (names.length === 1) {
      const fileName = names[0];
      const blob = new Blob([data[fileName]], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ferret-project.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClear() {
    const ok = await showConfirm("Are you sure you want to clear all files?");
    if (!ok) return;

    loadFiles({ "main.fer": "" }, { persist: true });

    terminalEvents = [{ type: "system", text: "All files cleared" }];
    inputLines = [];
    cachedRun = null;
    runState = "idle";
    activeRunToken = 0;

    status = "ready";
    statusText = "Ready";
  }

  // -----------------------------
  // Effects
  // -----------------------------

  // When active file changes, update Monaco model
  $effect(() => {
    if (editor && activeModel) {
      editor.setModel(activeModel);
      queueMicrotask(() => editor?.layout());
    }
  });

  // Auto-scroll terminal
  $effect(() => {
    void terminalEvents.length;
    void isWaitingInput;
    if (!outputLogEl) return;
    queueMicrotask(() => {
      if (outputLogEl) outputLogEl.scrollTop = outputLogEl.scrollHeight;
    });
  });

  // Focus terminal input
  $effect(() => {
    if (isWaitingInput && inputEl) {
      queueMicrotask(() => inputEl?.focus());
    }
  });

  // Persist files on every model change
  // (Monaco models update internally; we listen per-model)
  function attachModelSave(model: monaco.editor.ITextModel) {
    model.onDidChangeContent(() => saveToLocalStorage());
  }

  // -----------------------------
  // Mount
  // -----------------------------
  onMount(() => {
    let disposed = false;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRunning) abortRun("✗ Execution aborted by user.");
    };
    document.addEventListener("keydown", handleEsc);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !editorPanelEl || !playgroundContentEl || !outputPanelEl) return;

      const deltaX = e.clientX - startX;
      const containerWidth = playgroundContentEl.offsetWidth;
      let newEditorWidth = startEditorWidth + deltaX;

      const minWidth = Math.max(containerWidth * 0.4, 400);
      const maxWidth = Math.min(containerWidth * 0.6, containerWidth - 350);
      newEditorWidth = Math.max(minWidth, Math.min(maxWidth, newEditorWidth));

      const editorPercent = (newEditorWidth / containerWidth) * 100;
      editorPanelEl.style.flex = `0 0 calc(${editorPercent}% - 4px)`;
      outputPanelEl.style.flex = `0 0 calc(${100 - editorPercent}% - 4px)`;

      window.dispatchEvent(new Event("resize"));
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    (async () => {
      monacoApi = await import("monaco-editor");
      await registerFerretLanguage();
      await defineThemes();

      if (disposed) return;

      // Load default code from public folder or fallback
      let defaultCode = DEFAULT_CODE_FALLBACK;
      try {
        const resp = await fetch(defaultCodeRoute);
        if (resp.ok) {
          defaultCode = await resp.text();
        }
      } catch {
        // ignore
      }

      // Load files from URL -> localStorage -> default
      const params = new URLSearchParams(window.location.search);
      const filesParam = params.get("files");

      let loaded = false;
      if (filesParam) {
        try {
          const decoded = normalizeProjectFiles(JSON.parse(base64DecodeUnicode(filesParam)));
          loadFiles(decoded, { persist: true });
          loaded = true;
        } catch (e) {
          console.error("Failed to load files from URL:", e);
        }
      }

      if (!loaded) {
        loaded = loadFromLocalStorage();
      }

      if (!loaded) {
        loadFiles({ "main.fer": defaultCode }, { persist: true });
      }

      // Attach per-model save handlers
      for (const model of Object.values(files)) {
        attachModelSave(model);
      }

      // Create Monaco editor
      if (editorContainer) {
        const theme = getCurrentTheme();
        editor = monacoApi!.editor.create(editorContainer, {
          model: activeModel ?? undefined,
          language: "ferret",
          theme,
          automaticLayout: true,
        });

        editor.onDidChangeCursorPosition((e) => {
          cursorLine = e.position.lineNumber;
          cursorCol = e.position.column;
        });

        editor.addCommand(monacoApi!.KeyMod.CtrlCmd | monacoApi!.KeyCode.Enter, () => {
          void handleRun();
        });

        themeObserver = new MutationObserver(() => {
          const newTheme = getCurrentTheme();
          monacoApi!.editor.setTheme(newTheme);
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });

        requestAnimationFrame(() => editor?.layout());
      }

      await tick();
      outputPanelEl = playgroundContentEl?.querySelector(".output-panel") as HTMLDivElement | null;

      // Resize handle
      resizeHandleEl?.addEventListener("mousedown", (e) => {
        if (!editorPanelEl) return;
        isResizing = true;
        startX = (e as MouseEvent).clientX;
        startEditorWidth = editorPanelEl.offsetWidth;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      });

      // Init WASM
      status = "loading";
      statusText = "Loading...";
      const wasm = await initWasm();

      if (wasm.success) {
        compilerVersion = wasm.version || "unknown";
        status = "ready";
        statusText = "Ready";
      } else {
        status = "error";
        statusText = "Error";
        terminalEvents = [
          {
            type: "system",
            html: `<p style="color: #ef4444;">Failed to load compiler: ${escapeHtml(wasm.error || "Unknown error")}</p>`,
          },
        ];
      }
    })();

    return () => {
      disposed = true;
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      themeObserver?.disconnect();
      themeObserver = null;

      editor?.dispose();
      editor = null;

      for (const m of Object.values(files)) {
        try {
          m.dispose();
        } catch {
          // ignore
        }
      }
    };
  });
</script>

<Modal />

<div class="playground-container">
  <div class="playground-header">
    <div class="header-left">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>

      <!-- Tabs (NO nested buttons; fixes tab switch bugs) -->
      <div class="file-tabs">
        {#each Object.keys(files) as fileName (fileName)}
          <div
            class="file-tab"
            class:active={fileName === activeFile}
            role="button"
            tabindex="0"
            onclick={() => switchFile(fileName)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                switchFile(fileName);
              }
            }}
          >
            <span class="tab-name">{fileName}</span>
            {#if fileName !== "main.fer"}
              <button
                type="button"
                class="tab-close"
                title="Close"
                onclick={(e) => {
                  e.stopPropagation();
                  void handleCloseFile(fileName);
                }}
              >
                ×
              </button>
            {/if}
          </div>
        {/each}

        <button type="button" class="file-tab-add" title="Add new file" onclick={() => void handleAddFile()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="playground-actions">
      <button type="button" class="icon-button" title="Share Code" onclick={() => void handleShare()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>

      <button type="button" class="icon-button" title="Copy Code" onclick={() => void handleCopyActive()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>

      <button type="button" class="icon-button" title="Export Code" onclick={handleExport}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Export</span>
      </button>

      <button type="button" class="icon-button" title="Clear" onclick={() => void handleClear()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Clear</span>
      </button>

      <button
        type="button"
        disabled={status=="loading"}
        class="icon-button run-button"
        class:run-button-abort={isRunning}
        title={isRunning ? "Abort (Esc)" : "Run Code (Ctrl+Enter)"}
        onclick={() => void handleRun()}
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

  <div class="playground-content" bind:this={playgroundContentEl}>
    <div class="editor-panel" bind:this={editorPanelEl}>
      <div class="editor" bind:this={editorContainer}></div>
      <div class="editor-footer">
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span>UTF-8</span>
        <span>Ferret{compilerVersion ? ` • v${compilerVersion}` : ""}</span>
      </div>
    </div>

    <div class="resize-handle" bind:this={resizeHandleEl}>
      <div class="resize-handle-bar"></div>
    </div>

    <!-- Output Panel (inline prompt) -->
    <div class="output-panel">
      <div class="output-header">
        <span>Output</span>
        <div class="output-header-right">
          <button 
            type="button" 
            class="output-copy-btn" 
            class:output-copy-success={copySuccess}
            title="Copy Output"
            disabled={!hasOutput}
            onclick={() => void handleCopyOutput()}
          >
            {#if copySuccess}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            {/if}
          </button>
          <span class="output-status" data-status={status}>
            <span class="status-dot"></span>
            <span class="status-text">{statusText}</span>
          </span>
        </div>
      </div>

      <div class="output-content terminal">
        <div class="output-log" bind:this={outputLogEl}>
          {#if terminalEvents.length === 0 && runState === "idle"}
            <p class="output-placeholder">
              ✓ Ready to run your code...<br />
              <span class="keyboard-tip">💡 Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run</span>
            </p>
          {:else}
            <div class="terminal-output">{#each terminalEvents as ev (ev)}{@html renderEvent(ev)}{/each}</div>
          {/if}

          <div class="terminal-input" class:terminal-input-hidden={!isWaitingInput}>
            <span class="terminal-prompt">></span>
            <textarea
              bind:this={inputEl}
              bind:value={inputValue}
              class="terminal-input-field"
              rows="1"
              placeholder="stdin... (one line per read)"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              onkeydown={async (e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                await handleSubmitInput();
              }}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .playground-container {
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  :global([data-theme="dark"]) .playground-container {
    background: var(--editor-bg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .playground-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 1.25rem;
    background: #f7f7f7;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    gap: 1rem;
  }

  :global([data-theme="dark"]) .playground-header {
    background: var(--editor-bg);
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    flex: 1;
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

  /* Tabs */
  .file-tabs {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: thin;
    min-width: 0;
  }

  .file-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    user-select: none;
  }

  .file-tab:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }

  .file-tab.active {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }

  :global([data-theme="dark"]) .file-tab {
    color: #9ca3af;
  }

  :global([data-theme="dark"]) .file-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #d1d5db;
  }

  :global([data-theme="dark"]) .file-tab.active {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
  }

  .tab-name {
    line-height: 1;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.6;
    transform: translateX(5px);
    transition: opacity 0.15s ease;
  }

  .tab-close:hover {
    opacity: 1;
  }

  .file-tab-add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .file-tab-add svg {
    width: 14px;
    height: 14px;
  }

  .file-tab-add:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }

  :global([data-theme="dark"]) .file-tab-add {
    color: #9ca3af;
  }

  :global([data-theme="dark"]) .file-tab-add:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #d1d5db;
  }

  /* Actions */
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
    border-radius: 24px !important;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    background: transparent;
    border: none;
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
    display: block;
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="dark"]) .icon-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .run-button {
    background: #000000 !important;
    color: #ffffff !important;
  }

  .run-button:not(:disabled):hover {
    background: var(--accent-color) !important;
    color: #ffffff !important;
  }

  .run-button.run-button-abort {
    background: #ef4444;
    color: #ffffff;
  }

  .run-button.run-button-abort:hover {
    background: #dc2626 !important;
    color: #ffffff !important;
  }

  :global([data-theme="dark"]) .run-button {
    background: #ffffff !important;
    color: #000000 !important;
  }

  :global([data-theme="dark"]) .run-button.run-button-abort {
    background: #f87171;
    color: #111111;
  }
  
  .run-button:disabled {
      cursor: not-allowed;
      filter: brightness(0.8);
  }

  /* Layout */
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
    box-sizing: border-box;
  }

  :global([data-theme="dark"]) .editor-panel {
    background: var(--editor-bg);
  }

  .editor {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .editor :global(> div) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Override Starlight global styles that break Monaco */
  .editor :global(.view-lines),
  .editor :global(.view-line),
  .editor :global(.view-line > span),
  .editor :global(.mtk1),
  .editor :global(.mtk2),
  .editor :global(.mtk3),
  .editor :global(.mtk4),
  .editor :global(.mtk5),
  .editor :global(.mtk6) {
    font-family: Consolas, "Courier New", monospace !important;
    font-size: 14px !important;
    line-height: 19px !important;
    letter-spacing: 0 !important;
  }

  .editor-footer {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.6875rem;
    color: #9ca3af;
    background: rgba(0, 0, 0, 0.02);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  :global([data-theme="dark"]) .editor-footer {
    color: #6b7280;
    background: var(--editor-bg);
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
    box-sizing: border-box;
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

  /* Output */
  .output-panel {
    flex: 0 0 calc(40% - 4px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #fafafa;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: 0 0 16px 0;
  }

  :global([data-theme="dark"]) .output-panel {
    background: var(--editor-bg);
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    min-width: 0;
  }

  :global([data-theme="dark"]) .output-header {
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.02);
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .output-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .output-copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .output-copy-btn svg {
    width: 14px;
    height: 14px;
  }

  .output-copy-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }

  .output-copy-btn:disabled {
    cursor: not-allowed;
    visibility: hidden;
  }

  .output-copy-btn.output-copy-success {
    color: #10b981 !important;
  }

  :global([data-theme="dark"]) .output-copy-btn {
    color: #9ca3af;
  }

  :global([data-theme="dark"]) .output-copy-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: #d1d5db;
  }

  .output-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.6875rem;
    text-transform: none;
    font-weight: 500;
    flex-shrink: 0;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
  }

  .output-status[data-status="ready"] .status-dot {
    background: #10b981;
  }

  .output-status[data-status="loading"] .status-dot,
  .output-status[data-status="running"] .status-dot {
    background: #f59e0b;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .output-status[data-status="input"] .status-dot {
    background: #f97316;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .output-status[data-status="success"] .status-dot {
    background: #06b6d4;
  }

  .output-status[data-status="error"] .status-dot {
    background: #ef4444;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .output-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    font-family: "Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace;
    font-size: 0.8125rem;
    line-height: 1.2;
    color: #374151;
    background: #fafafa;
    border-radius: 0 0 16px 0;
    overflow: hidden;
    padding: 5px;
  }

  :global(.output-content * ){
    user-select: text;
  }

  :global([data-theme="dark"]) .output-content {
    color: #d1d5db;
    background: var(--editor-bg);
  }

  .output-log {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    border-radius: 0 0 16px 0;
    background: transparent;
  }


  .output-placeholder {
    color: #9ca3af;
    margin: 0;
  }

  :global([data-theme="dark"]) .output-placeholder {
    color: #6b7280;
  }

  .keyboard-tip {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .keyboard-tip kbd {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-family: "Consolas", "Monaco", monospace;
    background: rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
    margin: 0 0.125rem;
  }

  :global([data-theme="dark"]) .keyboard-tip kbd {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
  }

  :global(.terminal-output) {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    white-space: normal;
    overflow-x: auto;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible;
  }

  :global(.terminal-line) {
    display: block;
    white-space: pre-wrap;
    line-height: 1.45;
  }

  :global(.terminal-text) {
    white-space: pre-wrap;
    word-break: break-word;
  }

  :global(.terminal-input-line) {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  :global(.terminal-output-line) {
    color: inherit;
  }

  :global(.terminal-system) {
    color: #9ca3af;
    font-size: 0.75rem;
    font-style: italic;
  }

  :global([data-theme="dark"] .terminal-system) {
    color: #6b7280;
  }

  :global(.compiler-log) {
    margin-bottom: 0.5rem;
  }

  .terminal-input {
    display: flex;
    align-items: flex-start;
    border-top: none;
    background: transparent;
  }

  .terminal-input-hidden {
    display: none;
  }

  .terminal-prompt {
    font-weight: 600;
    color: var(--accent-color);
    line-height: 1.5;
    padding-top: 0.1rem;
  }

  .terminal-input-field {
    flex: 1;
    min-height: 1.6rem;
    max-height: 7rem;
    border: none;
    background: transparent;
    padding: .1rem 0 .1rem 0.5rem;
    font-family: "Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: inherit;
    resize: none;
    outline: none;
    overflow-y: auto;
  }

  .terminal-input-field::placeholder {
    color: #9ca3af;
  }

  :global([data-theme="dark"]) .terminal-input-field::placeholder {
    color: #6b7280;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .playground-container {
      margin: 1rem 0;
      border-radius: 12px;
    }

    .playground-header {
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .playground-actions {
      flex-wrap: wrap;
      width: 100%;
      justify-content: flex-end;
    }

    .icon-button {
      padding: 0.625rem;
      font-size: 0.75rem;
    }
    .icon-button > span {
      display: none;
    }

    .playground-content {
      flex-direction: column !important;
      height: auto;
      flex: 1;
      min-height: 0;
    }

    .editor-panel {
      height: 350px;
      min-width: unset !important;
      flex: 0 0 auto !important;
      min-height: 0;
    }

    .resize-handle {
      display: none !important;
    }

    .output-panel {
      width: 100% !important;
      min-width: unset !important;
      flex: 1 !important;
      min-height: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    :global([data-theme="dark"]) .output-panel {
      border-top-color: rgba(255, 255, 255, 0.05);
    }

    .output-content {
      font-size: 0.75rem;
    }

    .output-log {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
</style>
