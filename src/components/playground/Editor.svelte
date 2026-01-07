<script lang="ts">
  import { onMount } from "svelte";
  import type * as monaco from "monaco-editor";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import {
    registerFerretLanguage,
    defineThemes,
    getCurrentTheme,
  } from "../../lib/monaco-config";

  interface Props {
    model: monaco.editor.ITextModel | null;
    onCursorChange?: (line: number, column: number) => void;
    onRun?: () => void;
  }

  let { model, onCursorChange, onRun }: Props = $props();

  let containerRef: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | null = null;
  let currentTheme = getCurrentTheme();
  let themeObserver: MutationObserver | null = null;

  // Monaco worker setup
  // (Vite/SvelteKit needs this for Monaco to load its editor worker)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };

  onMount(() => {
    let disposed = false;

    (async () => {
      const monaco = await import("monaco-editor");
      await registerFerretLanguage();
      await defineThemes();

      if (disposed) return;
      if (!containerRef) return;

      // Create editor
      editor = monaco.editor.create(containerRef, {
        model: model ?? undefined,
        language: "ferret",
        theme: currentTheme,
        automaticLayout: true,
      });

      // Cursor position tracking
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.(e.position.lineNumber, e.position.column);
      });

      // Keyboard shortcut: Ctrl/Cmd+Enter to run
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun?.();
      });

      // Listen for theme changes
      themeObserver = new MutationObserver(() => {
        const newTheme = getCurrentTheme();
        if (newTheme !== currentTheme) {
          monaco.editor.setTheme(newTheme);
          currentTheme = newTheme;
        }
      });

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      // Force an initial layout
      requestAnimationFrame(() => editor?.layout());
    })();

    return () => {
      disposed = true;
      themeObserver?.disconnect();
      themeObserver = null;
      editor?.dispose();
      editor = null;
    };
  });

  // ✅ CRITICAL FIX: when the parent switches the active file,
  // the model prop changes — we must update Monaco's model.
  $effect(() => {
    if (editor && model) {
      editor.setModel(model);
      // Layout helps avoid rare sizing glitches after model switch
      requestAnimationFrame(() => editor?.layout());
    }
  });
</script>

<div class="editor" bind:this={containerRef}></div>

<style>
  .editor {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0; /* critical for flex children */
  }

  /* Ensure Monaco container has explicit dimensions */
  .editor :global(> div) {
    width: 100% !important;
    height: 100% !important;
  }

  /* CRITICAL: Override Starlight's global styles that break Monaco */
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
</style>
