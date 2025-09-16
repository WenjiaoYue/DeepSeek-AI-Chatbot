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
    <div class="avatar-container">
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
    <div class="avatar-container">
      <div class="avatar avatar-user">
        <User size={16} />
      </div>
    </div>
  {/if}
</div>

<style>
  .message-container {
    @apply flex w-full mb-6 items-end space-x-3;
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
  
  .avatar-user {
    @apply bg-gradient-to-br from-gray-500 to-gray-600;
  }
  
  .message-bubble {
    @apply max-w-[85%] p-4 shadow-lg animate-fade-in relative;
  }
  
  .message-user {
    @apply bg-gradient-to-br from-blue-500 to-blue-600 text-white;
    border-radius: 20px 20px 4px 20px;
  }
  
  .message-user::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -8px;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-top-color: #3b82f6;
    border-left-color: #3b82f6;
  }
  
  .message-assistant {
    @apply bg-white text-gray-900 border border-gray-200;
    border-radius: 20px 20px 20px 4px;
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