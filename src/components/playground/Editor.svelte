<script lang="ts">
  import { onMount } from 'svelte';
  import * as monaco from "monaco-editor";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import { registerFerretLanguage, defineThemes, getCurrentTheme } from "../../lib/monaco-config";

  interface Props {
    model: monaco.editor.ITextModel;
    onCursorChange?: (line: number, column: number) => void;
    onRun?: () => void;
  }

  let { model, onCursorChange, onRun }: Props = $props();

  let containerRef: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | null = null;
  let currentTheme = $state(getCurrentTheme());

  // Setup Monaco environment
  if (typeof window !== 'undefined') {
    self.MonacoEnvironment = {
      getWorker() {
        return new editorWorker();
      },
    };
  }

  onMount(() => {
    // Register language and themes
    registerFerretLanguage();
    defineThemes();

    // Create editor
    editor = monaco.editor.create(containerRef, {
      model,
      language: "ferret",
      theme: currentTheme,
      automaticLayout: true,
    });

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Keyboard shortcut: Ctrl+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun();
      }
    });

    // Force layout update
    requestAnimationFrame(() => {
      editor?.layout();
    });

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const newTheme = getCurrentTheme();
      if (newTheme !== currentTheme) {
        monaco.editor.setTheme(newTheme);
        currentTheme = newTheme;
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      editor?.dispose();
    };
  });

  // Update model when prop changes
  $effect(() => {
    if (editor && model) {
      editor.setModel(model);
    }
  });
</script>

<div class="editor-wrapper">
  <div bind:this={containerRef} class="editor"></div>
</div>

<style>
  .editor-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    position: relative;
  }

  .editor {
    width: 100%;
    height: 100%;
  }

  /* CRITICAL: Override Starlight's global styles that break Monaco */
  .editor :global(.view-lines),
  .editor :global(.view-line),
  .editor :global(.view-line) > :global(span),
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
