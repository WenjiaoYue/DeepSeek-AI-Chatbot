<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Send } from "lucide-svelte";

  const dispatch = createEventDispatcher<{ send: string }>();
  export let disabled = false;

  let message = "";
  let textarea: HTMLTextAreaElement;
  let showCounter = false;

  const MAX_HEIGHT_PX = 80; // ≈ 5rem

  function getLineHeight() {
    return parseInt(getComputedStyle(textarea).lineHeight || "24", 10) || 24;
  }

  function setInitialHeight() {
    if (!textarea) return;
    textarea.style.height = "auto"; // 单行起步
    textarea.style.overflowY = "hidden";
    showCounter = false;
  }

  function autoResize() {
    if (!textarea) return;
    const lh = getLineHeight();

    // 先放开再测量
    textarea.style.height = "auto";
    const scrollH = textarea.scrollHeight;

    const newHeight = Math.min(scrollH, MAX_HEIGHT_PX);
    textarea.style.height = `${newHeight}px`;
    // 到上限才允许滚动 -> 才会显示自定义滚动条
    textarea.style.overflowY = newHeight >= MAX_HEIGHT_PX ? "auto" : "hidden";

    // ≥3 行时显示计数
    showCounter = scrollH > lh * 2.5;
  }

  function handleInput() {
    if (message.length > 256) message = message.substring(0, 256);
    autoResize();
  }

  function sendMessage() {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    dispatch("send", trimmed);
    message = "";
    requestAnimationFrame(() => setInitialHeight());
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  }

  onMount(() => setInitialHeight());
</script>

<div class="input-section px-4 flex justify-center">
  <div class="w-full max-w-2xl">
    <div
      class="relative w-full rounded-3xl px-1
             bg-gray-600/5 dark:bg-gray-400/5 dark:text-gray-100
             border border-gray-300 transition-all chat-input-surface"
    >
      <!-- 主行：textarea + 发送按钮 -->
      <div class="flex items-end">
        <textarea
          bind:this={textarea}
          bind:value={message}
          on:input={handleInput}
          on:keydown={handleKeyDown}
          {disabled}
          class="flex-1 bg-transparent p-4 outline-none resize-none
                 focus:outline-none focus:ring-0 focus:shadow-none
                 no-focus-ring border-none leading-6 nice-scrollbar"
          style="box-sizing: content-box; scrollbar-gutter: stable both-edges; overscroll-behavior: contain;"
        />

        <button
          type="button"
          on:click={sendMessage}
          disabled={disabled || !message.trim()}
          class="ml-2 mb-2 flex items-center justify-center h-8 w-8
                 bg-blue-600 hover:bg-blue-700 text-white transition
                 disabled:bg-gray-400 disabled:cursor-not-allowed
                 rounded-md shadow-sm active:scale-95"
          aria-label="发送消息"
        >
          <Send size={16} />
        </button>
      </div>

      <!-- 字数统计（不占布局空间） -->
      {#if showCounter}
        <div
          class="pointer-events-none absolute right-12 bottom-2 text-[10px] text-gray-400 font-medium"
        >
          {message.length}/256
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* 主题变量：浅/深色一致管理 */
  .chat-input-surface {
    --sb-size: 8px;
    --sb-thumb: rgba(0, 0, 0, .35);
    --sb-thumb-hover: rgba(0, 0, 0, .55);
  }
  .dark .chat-input-surface {
    --sb-thumb: rgba(255, 255, 255, .35);
    --sb-thumb-hover: rgba(255, 255, 255, .55);
  }

  /* 自定义“非原生观感”的细滚动条 */
  /* Firefox */
  .nice-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: var(--sb-thumb) transparent;
  }
  /* WebKit (Chrome/Edge/Safari) */
  .nice-scrollbar::-webkit-scrollbar {
    width: var(--sb-size);
    height: var(--sb-size);
  }
  .nice-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .nice-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--sb-thumb);
    border-radius: 9999px;
    border: 2px solid transparent; /* 让拇指更“细” */
    background-clip: content-box;
  }
  .nice-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: var(--sb-thumb-hover);
  }

</style>
