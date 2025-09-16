<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Send } from "lucide-svelte";

  const dispatch = createEventDispatcher<{
    send: string;
  }>();

  export let disabled = false;

  let message = "";
  let textarea: HTMLTextAreaElement;

  function handleInput() {
    // 限制字符数为256
    if (message.length > 256) {
      message = message.substring(0, 256);
    }

    // 自动调整高度
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      sendMessage();
    }
  }

  function sendMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    dispatch("send", trimmedMessage);
    message = "";

    // 重置高度
    if (textarea) {
      textarea.style.height = "auto";
    }
  }
</script>

<div class="input-section bg-white p-4 md:p-6 flex justify-center">
  <div class="w-full max-w-2xl">
    <!-- 控制最大宽度为1/2并居中 -->
    <div class="flex items-center space-x-3">
      <div class="flex-1 relative flex items-center">
        <div
          class="relative rounded-xl group focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all w-full"
        >
          <textarea
            bind:this={textarea}
            bind:value={message}
            on:input={handleInput}
            on:keydown={handleKeyDown}
            {disabled}
            class="
              w-full
              bg-gray-50
              p-4
              pr-6 <!-- 减少右侧padding为滚动条留空间 -->
              rounded-xl
              border
              border-gray-200
              focus:border-transparent
              focus:ring-0
              scrollbar-thin
              scrollbar-thumb-gray-300
              resize-y 
              min-h-[3rem]
              max-h-48 
              overflow-y-auto 
            "
            style="scrollbar-gutter: stable;"
          />
        </div>

        <div
          class="absolute right-4 bottom-2 text-xs text-gray-400 font-medium"
        >
          {message.length}/256
        </div>
      </div>

      <button
        type="button"
        on:click={sendMessage}
        disabled={disabled || !message.trim()}
        class="flex items-center justify-center h-11 w-11 bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-200 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
      >
        <Send size={18} />
      </button>
    </div>
  </div>
</div>


<style>
/* 滚动条轨道透明处理 */
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

/* 滚动条thumb样式增强 */
.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
  border-radius: 0.5rem;
  border: 2px solid transparent;
  background-clip: content-box;
}


</style>
