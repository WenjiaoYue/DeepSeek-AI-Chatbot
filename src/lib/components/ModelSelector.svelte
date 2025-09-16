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
    <div class="selector-content hidden md:block">
      <div class="config-name">{selectedConfig?.name || '未选择配置'}</div>
      <div class="model-name">{$apiConfigStore.selectedModel || '未选择模型'}</div>
    </div>
    <div class="selector-indicator">
      <div class="status-dot hidden md:block {selectedConfig ? 'connected' : 'disconnected'}"></div>
      <ChevronDown size={16} class="chevron {isOpen ? 'rotate-180' : ''} transition-transform duration-200 text-gray-700" />
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
    @apply flex items-center w-full px-4 py-3 bg-white/95 backdrop-blur-sm border border-white/40 text-left hover:bg-white hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg;
  }
  
  .selector-icon {
    @apply flex-shrink-0 text-gray-700 mr-3;
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
    @apply text-sm font-semibold text-gray-800 truncate;
  }
  
  .model-name {
    @apply text-xs text-gray-600 truncate font-medium;
  }
  
  .chevron {
    @apply text-gray-600 group-hover:text-gray-800;
  }
  
  .dropdown {
    @apply absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm rounded-xl;
  }
  
  .dropdown-item {
    @apply w-full px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-all duration-150 flex items-center justify-between;
  }
  
  .dropdown-item.active {
    @apply bg-gray-200 text-gray-900 font-medium;
  }
  
  .model-info {
    @apply flex items-center space-x-2 flex-1 min-w-0;
  }
  
  .model-icon {
    @apply text-gray-600 flex-shrink-0;
  }
  
  .model-text {
    @apply truncate;
  }
  
  .check-mark {
    @apply text-green-600 font-bold flex-shrink-0;
  }
</style>