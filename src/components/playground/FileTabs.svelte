<script lang="ts">
  import type * as monaco from "monaco-editor";
  import Modal, { showAlert, showPrompt } from "../Modal.svelte";

  interface Props {
    files: Record<string, monaco.editor.ITextModel>;
    activeFile: string;
    onFileSwitch: (fileName: string) => void;
    onFileAdd: (fileName: string) => void;
    onFileRemove: (fileName: string) => void;
  }

  let { files, activeFile, onFileSwitch, onFileAdd, onFileRemove }: Props = $props();

  async function handleAddFile() {
    // Using window.prompt for simplicity - could be replaced with custom modal
    //const fileName = window.prompt("Enter file name (e.g., utils.fer):", "");
    const fileName = await showPrompt("Enter file name (e.g., utils.fer):", "");
    if (!fileName) return;
    
    if (!fileName.endsWith(".fer")) {
      //alert("File name must end with .fer");
      showAlert("File name must end with .fer");
      return;
    }
    
    if (files[fileName]) {
      //alert("File already exists");
      showAlert("File already exists");
      return;
    }
    
    onFileAdd(fileName);
  }

  async function handleRemoveFile(fileName: string) {
    if (fileName === "main.fer") {
      //alert("Cannot remove main.fer");
      showAlert("Cannot remove main.fer");
      return;
    }
    
    const confirmed = window.confirm(`Remove ${fileName}?`);
    if (confirmed) {
      onFileRemove(fileName);
    }
  }
</script>

<div class="file-tabs">
  {#each Object.keys(files) as fileName}
    <button
      class="file-tab"
      class:active={fileName === activeFile}
      onclick={() => onFileSwitch(fileName)}
    >
      <span class="tab-name">{fileName}</span>
      {#if fileName !== "main.fer"}
        <button
          class="tab-close"
          onclick={(e) => {
            e.stopPropagation();
            handleRemoveFile(fileName);
          }}
          aria-label="Close {fileName}"
        >
          ×
        </button>
      {/if}
    </button>
  {/each}
  <button class="file-tab-add" onclick={handleAddFile} aria-label="Add file">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
</div>

<style>
  .file-tabs {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .file-tabs::-webkit-scrollbar {
    height: 4px;
  }

  .file-tabs::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  :global([data-theme="dark"]) .file-tabs::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
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
</style>
