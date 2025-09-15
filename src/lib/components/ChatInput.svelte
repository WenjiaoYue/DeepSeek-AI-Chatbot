<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Send } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher<{
    send: string;
  }>();
  
  export let disabled = false;
  
  let message = '';
  let textarea: HTMLTextAreaElement;
  
  function handleInput() {
    // 限制字符数为256
    if (message.length > 256) {
      message = message.substring(0, 256);
    }
    
    // 自动调整高度
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function sendMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;
    
    dispatch('send', trimmedMessage);
    message = '';
    
    // 重置高度
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }
</script>

<div class="input-section bg-white border-t border-gray-200 p-4">
  <div class="flex items-end space-x-3">
    <div class="flex-1 relative">
      <textarea
        bind:this={textarea}
        bind:value={message}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        placeholder="输入您的问题..."
        rows="1"
        maxlength="256"
        class="w-full resize-none border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-lg"
        {disabled}
      />
      <div class="absolute right-3 bottom-3 text-xs text-gray-400">
        {message.length}/256
      </div>
    </div>
    
    <button
      type="button"
      on:click={sendMessage}
      disabled={disabled || !message.trim()}
      class="flex h-10 w-10 items-center justify-center bg-blue-500 text-white transition-all duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg"
    >
      <Send size={18} />
    </button>
  </div>
</div>