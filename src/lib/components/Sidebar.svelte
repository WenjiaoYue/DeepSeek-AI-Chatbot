<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { chatHistoryStore } from '../stores/chat-history';
  import { Plus, MessageSquare, Trash2, Settings } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher<{
    newChat: void;
    selectSession: string;
    deleteSession: string;
    openSettings: void;
  }>();
  
  export let isOpen = false;
  
  function handleNewChat() {
    dispatch('newChat');
  }
  
  function handleSelectSession(sessionId: string) {
    dispatch('selectSession', sessionId);
  }
  
  function handleDeleteSession(sessionId: string, event: Event) {
    event.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      dispatch('deleteSession', sessionId);
    }
  }
  
  function handleOpenSettings() {
    dispatch('openSettings');
  }
  
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  }
</script>

<div class="sidebar {isOpen ? 'sidebar-open' : 'sidebar-closed'}">
  <div class="sidebar-header">
    <button
      class="new-chat-btn"
      on:click={handleNewChat}
    >
      <Plus size={16} />
      <span>新对话</span>
    </button>
    
    <button
      class="settings-btn"
      on:click={handleOpenSettings}
    >
      <Settings size={16} />
    </button>
  </div>
  
  <div class="sidebar-content">
    <div class="section-title">历史对话</div>
    
    <div class="chat-list">
      {#each $chatHistoryStore.sessions as session (session.id)}
        <div 
          class="chat-item group {$chatHistoryStore.currentSessionId === session.id ? 'active' : ''}"
          on:click={() => handleSelectSession(session.id)}
        >
          <div class="chat-item-content">
            <MessageSquare size={14} />
            <div class="chat-item-text">
              <div class="chat-title">{session.title}</div>
              <div class="chat-date">{formatDate(session.updatedAt)}</div>
            </div>
          </div>
          <button
            class="delete-btn"
            on:click={(e) => handleDeleteSession(session.id, e)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      {/each}
      
      {#if $chatHistoryStore.sessions.length === 0}
        <div class="empty-state">
          <MessageSquare size={24} />
          <span>暂无历史对话</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sidebar {
    @apply fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 z-40;
    width: 280px;
  }
  
  .sidebar-closed {
    transform: translateX(-100%);
  }
  
  .sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar-header {
    @apply flex items-center justify-between p-4 border-b border-gray-200;
  }
  
  .new-chat-btn {
    @apply flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors;
  }
  
  .settings-btn {
    @apply p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors;
  }
  
  .sidebar-content {
    @apply flex-1 overflow-y-auto p-4;
  }
  
  .section-title {
    @apply text-sm font-semibold text-gray-700 mb-3;
  }
  
  .chat-list {
    @apply space-y-1;
  }
  
  .chat-item {
    @apply flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer transition-colors;
  }
  
  .chat-item.active {
    @apply bg-blue-50 border-l-4 border-blue-600;
  }
  
  .chat-item-content {
    @apply flex items-center space-x-3 flex-1 min-w-0;
  }
  
  .chat-item-text {
    @apply flex-1 min-w-0;
  }
  
  .chat-title {
    @apply text-sm font-medium text-gray-900 truncate;
  }
  
  .chat-date {
    @apply text-xs text-gray-500;
  }
  
  .delete-btn {
    @apply p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all;
  }
  
  .empty-state {
    @apply flex flex-col items-center justify-center py-8 text-gray-500;
  }
  
  .empty-state span {
    @apply mt-2 text-sm;
  }
</style>