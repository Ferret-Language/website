<script lang="ts" module>
  interface ModalOptions {
    title?: string;
    selectableContent?: boolean;
    selectableText?: string;
  }

  // Export helper functions that can be imported by other components
  export function showAlert(message: string, options?: ModalOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      const event = new CustomEvent('show-modal', {
        detail: { 
          type: 'alert', 
          message, 
          ...options, 
          onConfirm: resolve 
        }
      });
      window.dispatchEvent(event);
    });
  }

  export function showConfirm(message: string, options?: ModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const event = new CustomEvent('show-modal', {
        detail: {
          type: 'confirm',
          message,
          ...options,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        }
      });
      window.dispatchEvent(event);
    });
  }

  export function showPrompt(
    message: string, 
    placeholder = '', 
    defaultValue = '', 
    options?: ModalOptions
  ): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const event = new CustomEvent('show-modal', {
        detail: {
          type: 'prompt',
          message,
          inputPlaceholder: placeholder,
          inputValue: defaultValue,
          ...options,
          onConfirm: (value?: string) => resolve(value || null),
          onCancel: () => resolve(null)
        }
      });
      window.dispatchEvent(event);
    });
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  // Internal state (no props needed - controlled via events)
  let isOpen = $state(false);
  let title = $state('');
  let message = $state('');
  let type = $state<'alert' | 'confirm' | 'prompt'>('alert');
  let inputValue = $state('');
  let inputPlaceholder = $state('');
  let confirmText = $state('OK');
  let cancelText = $state('Cancel');
  let selectableContent = $state(false);
  let selectableText = $state('');
  let onConfirm: ((value?: string) => void) | null = null;
  let onCancel: (() => void) | null = null;

  let inputElement: HTMLInputElement | null = $state(null);

  // Listen for show-modal events from Playground
  onMount(() => {
    const handleShowModal = (event: CustomEvent) => {
      const { 
        type: modalType = 'alert',
        message: modalMessage = '',
        title: modalTitle = '',
        inputPlaceholder: placeholder = '',
        inputValue: defaultValue = '',
        confirmText: confirmTxt = 'OK',
        cancelText: cancelTxt = 'Cancel',
        selectableContent: selectable = false,
        selectableText: selectableTxt = '',
        onConfirm: confirmCallback = null,
        onCancel: cancelCallback = null
      } = event.detail;

      isOpen = true;
      type = modalType;
      message = modalMessage;
      title = modalTitle;
      inputPlaceholder = placeholder;
      inputValue = defaultValue;
      confirmText = confirmTxt;
      cancelText = cancelTxt;
      selectableContent = selectable;
      selectableText = selectableTxt;
      onConfirm = confirmCallback;
      onCancel = cancelCallback;
    };

    window.addEventListener('show-modal', handleShowModal as EventListener);

    return () => {
      window.removeEventListener('show-modal', handleShowModal as EventListener);
    };
  });

  function handleConfirm() {
    if (onConfirm) {
      onConfirm(type === 'prompt' ? inputValue : undefined);
    }
    close();
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
    close();
  }

  function close() {
    isOpen = false;
    inputValue = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  $effect(() => {
    if (isOpen && type === 'prompt' && inputElement) {
      inputElement.focus();
    }
  });

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
    <div class="modal-container" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      {#if title}
        <h2 id="modal-title" class="modal-title">{title}</h2>
      {/if}
      
      <div class="modal-content">
        {#if message}
          <p class="modal-message">{message}</p>
        {/if}
        
        {#if selectableContent && selectableText}
          <div class="modal-selectable-content">
            <pre class="modal-selectable-text">{selectableText}</pre>
          </div>
        {/if}
        
        {#if type === 'prompt'}
          <input
            bind:this={inputElement}
            bind:value={inputValue}
            type="text"
            placeholder={inputPlaceholder}
            class="modal-input"
          />
        {/if}
      </div>
      
      <div class="modal-actions">
        {#if type !== 'alert'}
          <button class="modal-button modal-button-cancel" onclick={handleCancel}>
            {cancelText}
          </button>
        {/if}
        <button class="modal-button modal-button-confirm" onclick={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.08s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    padding: 1.5rem;
    animation: slideIn 0.1s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  :global([data-theme="dark"]) .modal-container {
    background: var(--border);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  .modal-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  :global([data-theme="dark"]) .modal-title {
    color: #f9fafb;
  }

  .modal-content {
    margin-bottom: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Custom scrollbar for modal content */
  .modal-content::-webkit-scrollbar {
    width: 8px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  :global([data-theme="dark"]) .modal-content::-webkit-scrollbar-track {
    background: #1f2937;
  }

  :global([data-theme="dark"]) .modal-content::-webkit-scrollbar-thumb {
    background: #4b5563;
  }

  :global([data-theme="dark"]) .modal-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .modal-message {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    line-height: 1.6;
    color: #374151;
    user-select: none;
  }

  .modal-selectable-content {
    margin-top: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 0.875rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    user-select: text;
    cursor: text;
  }

  .modal-selectable-text {
    margin: 0;
    font-family: 'Courier New', Consolas, monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #1f2937;
    word-break: break-all;
    white-space: pre-wrap;
    user-select: text;
  }

  :global([data-theme="dark"]) .modal-message {
    color: #d1d5db;
  }

  :global([data-theme="dark"]) .modal-selectable-content {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  :global([data-theme="dark"]) .modal-selectable-text {
    color: #e5e7eb;
  }

  .modal-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    color: #111827;
    outline: none;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .modal-input:focus {
    border-color: var(--accent-color, #4f46e5);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  :global([data-theme="dark"]) .modal-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  :global([data-theme="dark"]) .modal-input:focus {
    border-color: var(--accent-color, #8b5cf6);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .modal-button {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
  }

  .modal-button-cancel {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-button-cancel:hover {
    background: #e5e7eb;
  }

  .modal-button-cancel:active {
    transform: scale(0.98);
  }

  :global([data-theme="dark"]) .modal-button-cancel {
    background: #374151;
    color: #d1d5db;
  }

  :global([data-theme="dark"]) .modal-button-cancel:hover {
    background: #4b5563;
  }

  .modal-button-confirm {
    background: var(--accent-color, #4f46e5);
    color: #ffffff;
  }

  .modal-button-confirm:hover {
    opacity: 0.9;
  }

  .modal-button-confirm:active {
    transform: scale(0.98);
  }

  @media (max-width: 640px) {
    .modal-container {
      width: 95%;
      padding: 1.25rem;
    }

    .modal-title {
      font-size: 1.125rem;
    }

    .modal-message {
      font-size: 0.875rem;
    }

    .modal-actions {
      flex-direction: column-reverse;
    }

    .modal-button {
      width: 100%;
    }
  }
</style>
