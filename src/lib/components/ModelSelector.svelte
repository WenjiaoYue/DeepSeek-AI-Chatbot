<script lang="ts">
  import { apiConfigStore } from '../stores/api-config';
  import { ChevronDown, Cpu, Zap } from 'lucide-svelte';
  
  let isOpen = false;
  
  $: selectedConfig = $apiConfigStore.configs.find(c => c.id === $apiConfigStore.selectedConfigId);
  $: availableModels = selectedConfig?.models || [];
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function selectModel(model: string) {
    apiConfigStore.selectModel(model);
    isOpen = false;
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.model-selector')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="model-selector">
  <button 
    class="selector-button group"
    on:click|stopPropagation={toggleDropdown}
  >
    <div class="selector-icon">
      <Cpu size={18} />
    </div>
    <div class="selector-content">
      <div class="config-name">{selectedConfig?.name || '未选择配置'}</div>
      <div class="model-name">{$apiConfigStore.selectedModel || '未选择模型'}</div>
    </div>
    <div class="selector-indicator">
      <div class="status-dot {selectedConfig ? 'connected' : 'disconnected'}"></div>
      <ChevronDown size={16} class="chevron {isOpen ? 'rotate-180' : ''} transition-transform duration-200" />
    </div>
  </button>
  
  {#if isOpen && availableModels.length > 0}
    <div class="dropdown">
      {#each availableModels as model}
        <button
          class="dropdown-item {$apiConfigStore.selectedModel === model ? 'active' : ''} group"
          on:click={() => selectModel(model)}
        >
          <div class="model-info">
            <Zap size={14} class="model-icon" />
            <span class="model-text">{model}</span>
          </div>
          {#if $apiConfigStore.selectedModel === model}
            <div class="check-mark">✓</div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .model-selector {
    @apply relative min-w-0;
  }
  
  .selector-button {
    @apply flex items-center w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border border-gray-300 text-left hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md;
  }
  
  .selector-icon {
    @apply flex-shrink-0 text-blue-600 mr-3;
  }
  
  .selector-content {
    @apply flex-1 min-w-0;
  }
  
  .selector-indicator {
    @apply flex items-center space-x-2 flex-shrink-0;
  }
  
  .status-dot {
    @apply w-2 h-2 rounded-full;
  }
  
  .status-dot.connected {
    @apply bg-green-500 shadow-sm;
  }
  
  .status-dot.disconnected {
    @apply bg-red-500;
  }
  
  .config-name {
    @apply text-sm font-semibold text-gray-900 truncate;
  }
  
  .model-name {
    @apply text-xs text-blue-600 truncate font-medium;
  }
  
  .chevron {
    @apply text-gray-500 group-hover:text-blue-600;
  }
  
  .dropdown {
    @apply absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 shadow-xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm rounded-lg;
  }
  
  .dropdown-item {
    @apply w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 focus:outline-none focus:bg-blue-50 transition-all duration-150 flex items-center justify-between;
  }
  
  .dropdown-item.active {
    @apply bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-medium;
  }
  
  .model-info {
    @apply flex items-center space-x-2 flex-1 min-w-0;
  }
  
  .model-icon {
    @apply text-blue-500 flex-shrink-0;
  }
  
  .model-text {
    @apply truncate;
  }
  
  .check-mark {
    @apply text-blue-600 font-bold flex-shrink-0;
  }
</style>