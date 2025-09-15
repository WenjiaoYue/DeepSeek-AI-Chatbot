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
  <div class="sidebar-header bg-gradient-to-r from-gray-800 to-gray-900 text-white">
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
  
  <div class="sidebar-content bg-white">
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
    @apply fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 shadow-2xl;
    width: 280px;
  }
  
  .sidebar-closed {
    transform: translateX(-100%);
  }
  
  .sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar-header {
    @apply flex items-center justify-between p-4 border-b border-gray-300/30;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  }
  
  .new-chat-btn {
    @apply flex items-center space-x-2 px-4 py-2 bg-white/80 text-gray-700 text-sm font-medium hover:bg-white hover:shadow-sm transition-all duration-200 rounded-lg backdrop-blur-sm;
  }
  
  .settings-btn {
    @apply p-2 text-gray-600 hover:text-gray-800 hover:bg-white/60 transition-all duration-200 rounded-lg;
  }
  
  .sidebar-content {
    @apply flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50;
  }
  
  .section-title {
    @apply text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide;
  }
  
  .chat-list {
    @apply space-y-1;
  }
  
  .chat-item {
    @apply flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm;
  }
  
  .chat-item.active {
    @apply bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm;
  }
  
  .chat-item-content {
    @apply flex items-center space-x-3 flex-1 min-w-0 overflow-hidden;
  }
  
  .chat-item-text {
    @apply flex-1 min-w-0 overflow-hidden;
  }
  
  .chat-title {
    @apply text-sm font-medium text-gray-900 truncate leading-tight;
  }
  
  .chat-date {
    @apply text-xs text-gray-500 truncate;
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