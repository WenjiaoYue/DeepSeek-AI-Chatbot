<script lang="ts">
  import { parseMarkdown, formatTime } from '../utils/markdown';
  import type { Message } from '../stores/chat';
  import { User, Bot } from 'lucide-svelte';
  
  export let message: Message;
  
  $: formattedContent = message.role === 'assistant' 
    ? parseMarkdown(message.content) 
    : message.content;
</script>

<div class="message-container animate-fade-in {message.role === 'user' ? 'justify-end' : 'justify-start'}">
  {#if message.role === 'assistant'}
    <!-- 桌面显示头像，移动端隐藏 -->
    <div class="avatar-container hidden sm:flex">
      <div class="avatar avatar-bot">
        <Bot size={16} />
      </div>
    </div>
  {/if}
  
  <div class="message-bubble message-{message.role}">
    {#if message.role === 'assistant'}
      <div class="prose-chat">
        {@html formattedContent}
      </div>
    {:else}
      <div class="whitespace-pre-wrap">
        {message.content}
      </div>
    {/if}
    <div class="message-time text-xs opacity-60 mt-2 text-right">
      {formatTime(message.timestamp)}
    </div>
  </div>
  
  {#if message.role === 'user'}
    <!-- 桌面显示头像，移动端隐藏 -->
    <div class="avatar-container hidden sm:flex">
      <div class="avatar avatar-user">
        <User size={16} />
      </div>
    </div>
  {/if}
</div>

<style>
  .message-container {
    /* 移动端无间距，桌面端保留左右头像间距 */
    @apply flex w-full mb-6 items-end space-x-0 sm:space-x-3;
  }

  .avatar-container {
    @apply flex-shrink-0;
  }

  .avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md;
  }

  .avatar-bot {
    @apply bg-gradient-to-br from-blue-500 to-blue-600;
  }

  /* 更克制的蓝色头像渐变 */
  .avatar-user {
    @apply bg-gradient-to-br from-blue-500 to-indigo-600;
  }

  .message-bubble {
    @apply max-w-[85%] p-4 shadow-lg animate-fade-in relative;
  }

  /* ------- 用户气泡（右侧） ------- */
  .message-user {
    /* 用 CSS 变量统一气泡与尾巴的渐变来源，避免任何色差或错位 */
    --bubble-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); /* blue-500 -> blue-600 */
    background: var(--bubble-gradient);
    color: white;
    border-radius: 20px 20px 4px 20px;
    position: relative;
  }


  .message-assistant {
    @apply bg-white text-gray-900 border border-gray-200;
    border-radius: 20px 20px 20px 4px;
    position: relative;
  }

  .message-assistant::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -8px;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-top-color: white;
    border-right-color: white;
  }

  .message-time {
    @apply text-xs opacity-70 mt-2 text-right;
  }
</style>
