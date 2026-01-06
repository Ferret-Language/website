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
  let onConfirm: ((value?: string) => void) | null = null;
  let onCancel: (() => void) | null = null;

  let inputElement: HTMLInputElement | null = null;

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
    } else if (e.key === 'Enter' && type !== 'prompt') {
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
        <p class="modal-message">{message}</p>
        
        {#if type === 'prompt'}
          <input
            bind:this={inputElement}
            bind:value={inputValue}
            type="text"
            placeholder={inputPlaceholder}
            class="modal-input"
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
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
    background: #1f2937;
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
  }

  .modal-message {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: bold;
    line-height: 1.6;
    color: #374151;
  }

  :global([data-theme="dark"]) .modal-message {
    color: #d1d5db;
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
