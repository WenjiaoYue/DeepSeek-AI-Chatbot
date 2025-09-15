<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus, Trash2 } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher<{
    newChat: void;
    clearChat: void;
  }>();
  
  export let hasMessages = false;
  
  function handleNewChat() {
    dispatch('newChat');
  }
  
  function handleClearChat() {
    if (!hasMessages) return;
    
    if (confirm('确定要清空当前对话吗？')) {
      dispatch('clearChat');
    }
  }
</script>

<div class="action-buttons bg-white border-t border-gray-200 p-4">
  <div class="flex justify-between space-x-4">
    <button
      type="button"
      on:click={handleNewChat}
      class="flex items-center space-x-2 border border-blue-300 bg-transparent px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
    >
      <Plus size={16} />
      <span>新对话</span>
    </button>
    
    <button
      type="button"
      on:click={handleClearChat}
      disabled={!hasMessages}
      class="flex items-center space-x-2 border border-red-300 bg-transparent px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
    >
      <Trash2 size={16} />
      <span>清空对话</span>
    </button>
  </div>
</div>