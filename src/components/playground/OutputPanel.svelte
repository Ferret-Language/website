<script lang="ts">
  interface TerminalEvent {
    type: "output" | "input" | "system";
    text?: string;
    html?: string;
  }

  interface Props {
    events: TerminalEvent[];
    status: "loading" | "ready" | "running" | "input" | "success" | "error";
    statusText: string;
    isWaitingInput: boolean;
    onInput?: (value: string) => void;
    version?: string;
  }

  let {
    events,
    status,
    statusText,
    isWaitingInput,
    onInput,
    version = "Loading..."
  }: Props = $props();

  let inputValue = $state("");
  let inputElement: HTMLTextAreaElement | null = null;
  let outputLogElement: HTMLDivElement | null = null;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim() || !onInput) return;
      onInput(inputValue);
      inputValue = "";
    }
  }

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderEvent(event: TerminalEvent): string {
    if (event.html) {
      return event.html;
    }
    if (event.type === "input") {
      return `<div class="terminal-line terminal-input-line"><span class="terminal-prompt">></span><span class="terminal-text">${escapeHtml(event.text || "")}</span></div>`;
    }
    if (event.type === "system") {
      return `<div class="terminal-line terminal-system">${escapeHtml(event.text || "")}</div>`;
    }
    return `<pre class="terminal-output">${escapeHtml(event.text || "")}</pre>`;
  }

  $effect(() => {
    if (isWaitingInput && inputElement) {
      inputElement.focus();
    }
  });

  // Keep terminal pinned to the bottom as new events arrive (matches old inline prompt behavior)
  $effect(() => {
    // Touch dependencies so this reruns when output changes
    void events.length;
    void isWaitingInput;

    if (!outputLogElement) return;

    // Wait a tick so the DOM updates before scrolling
    queueMicrotask(() => {
      if (!outputLogElement) return;
      outputLogElement.scrollTop = outputLogElement.scrollHeight;
    });
  });
</script>

<div class="output-panel">
  <div class="output-header">
    <span>Output</span>
    <span class="output-status" data-status={status}>
      <span class="status-dot"></span>
      <span class="status-text">{statusText}</span>
    </span>
  </div>
  
  <div class="output-content terminal">
    <div class="output-log" bind:this={outputLogElement}>
      {#if events.length === 0}
        <p class="output-placeholder">
          Ready to compile and run your Ferret code.
          <span class="keyboard-tip">
            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> or click <strong>Run</strong> to execute
          </span>
        </p>
      {:else}
        {#each events as event}
          {@html renderEvent(event)}
        {/each}
      {/if}

      <!-- Inline input prompt (inside scrollable log) -->
      <div class="terminal-input" class:terminal-input-hidden={!isWaitingInput}>
        <span class="terminal-prompt">></span>
        <textarea
          bind:this={inputElement}
          bind:value={inputValue}
          onkeydown={handleKeydown}
          class="terminal-input-field"
          placeholder="Type input and press Enter..."
          rows="1"
        ></textarea>
      </div>
    </div>
  </div>
</div>

<style>
  .output-panel {
    flex: 0 0 calc(40% - 4px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #fafafa;
    box-sizing: border-box;
    overflow: hidden;
  }

  :global([data-theme="dark"]) .output-panel {
    background: var(--editor-bg);
    border-left-color: rgba(255, 255, 255, 0.05);
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

  .output-status[data-status="loading"] .status-dot {
    background: #f59e0b;
    animation: pulse 1.5s ease-in-out infinite;
  }

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
    line-height: 1.6;
    color: #374151;
  }

  :global([data-theme="dark"]) .output-content {
    color: #d1d5db;
  }

  .output-log {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
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
    white-space: pre;
    overflow-x: auto;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible;
  }

  :global(.terminal-line) {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    white-space: pre-wrap;
    font-style: italic;
  }

  :global(.terminal-text) {
    white-space: pre-wrap;
  }

  .terminal-system {
    color: #9ca3af;
    font-size: 0.75rem;
  }

  :global([data-theme="dark"]) .terminal-system {
    color: #6b7280;
  }

  .terminal-input {
    display: flex;
    align-items: flex-start;
    border-top: none;
    background: transparent;
  }

  :global([data-theme="dark"]) .terminal-input {
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
    padding: 0.1rem 0;
    padding-left: 5px;
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
</style>
