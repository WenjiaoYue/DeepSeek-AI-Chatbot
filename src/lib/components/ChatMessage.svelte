<script lang="ts">
  import { parseMarkdown, formatTime } from '../utils/markdown';
  import type { Message } from '../stores/chat';
  import { User, Bot } from 'lucide-svelte';
  import { afterUpdate } from 'svelte';

  export let message: Message;

  $: formattedContent =
    message.role === 'assistant'
      ? parseMarkdown(message.content)
      : message.content;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // 助手消息是否有“可显示”的文本（基于原始 content，避免仅有 HTML 标签时误判为有内容）
  $: hasText =
    (message?.content ?? '').trim().length > 0;

// 是否展示 reasoning 折叠框（仅助手消息，且内容不是“暂无推理过程”）
$: hasReasoning =
  isAssistant &&
  typeof message?.meta?.reasoningContent === 'string' &&
  message.meta.reasoningContent.trim().length > 0 &&
  message.meta.reasoningContent.trim() !== '暂无推理过程';


  // --- 默认展开逻辑 ---
  let reasoningOpen = false;
  let userTouchedReasoning = false;
  $: if (!userTouchedReasoning && hasReasoning) {
    reasoningOpen = true;
  }

  // --- 滚动逻辑 ---
  let reasoningBox: HTMLPreElement | null = null;
  afterUpdate(() => {
    if (reasoningBox && reasoningOpen && hasReasoning) {
      reasoningBox.scrollTop = reasoningBox.scrollHeight;
    }
  });
</script>

<div
  class="flex w-full items-end mb-6 gap-0 sm:gap-3 animate-fade-in"
  class:justify-end={isUser}
  class:justify-start={isAssistant}
>
  {#if isAssistant}
    <div class="hidden sm:flex shrink-0">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
        <Bot size={16} />
      </div>
    </div>
  {/if}

  <div class="flex flex-col max-w-[85%] w-full">
    {#if hasReasoning}
      <details
        bind:open={reasoningOpen}
        on:toggle={() => (userTouchedReasoning = true)}
        class="mb-2 rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-sm text-amber-900"
      >
        <summary class="cursor-pointer select-none font-medium">
          推理过程（reasoning）
        </summary>
        <pre
          bind:this={reasoningBox}
          class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words leading-relaxed"
        >
  {message.meta.reasoningContent?.trim() || '暂无推理过程'}
        </pre>
      </details>
    {/if}

    <!-- 气泡：仅当（不是助手）或（助手且已有文本）时渲染 -->
    {#if !isAssistant || hasText}
      <div
        class="
          relative p-4 shadow-lg
          {isAssistant
            ? 'bg-white text-gray-900 border border-gray-200 rounded-[20px] rounded-bl-[4px]'
            : 'text-white rounded-[20px] rounded-br-[4px] bg-gradient-to-br from-blue-500 to-blue-600'}
        "
      >
        {#if isAssistant}
          <div class="prose-chat">
            {@html formattedContent}
          </div>
        {:else}
          <div class="whitespace-pre-wrap">
            {message.content}
          </div>
        {/if}

        {#if message.timestamp}
          <div class="text-xs opacity-60 mt-2 text-right">
            {formatTime(message.timestamp)}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if isUser}
    <div class="hidden sm:flex shrink-0">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
        <User size={16} />
      </div>
    </div>
  {/if}
</div>
