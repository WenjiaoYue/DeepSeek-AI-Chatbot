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

<div class="model-selector relative z-[60] overflow-visible">
  <button 
    class="selector-button group flex items-center gap-2 rounded-lg px-2 py-1 md:px-3 md:py-1.5
           bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
    on:click|stopPropagation={toggleDropdown}
  >
    <div class="selector-icon shrink-0 grid place-items-center">
      <Cpu size={18} />
    </div>

    <!-- 文本区域 -->
    <div class="selector-content hidden md:flex md:flex-col md:min-w-[10rem] md:max-w-[18rem]">
      <div class="config-name text-sm font-medium text-gray-900 break-words">
        {selectedConfig?.name || '未选择配置'}
      </div>
      <div class="model-name text-xs text-gray-500 break-words">
        {$apiConfigStore.selectedModel || '未选择模型'}
      </div>
    </div>

    <div class="selector-indicator flex items-center gap-1">
      <div class="hidden md:block">
        <span class="inline-block h-2 w-2 rounded-full
                     {selectedConfig ? 'bg-emerald-500' : 'bg-gray-300'}"></span>
      </div>
      <ChevronDown
        size={16}
        class="chevron transition-transform duration-200 text-gray-700 {isOpen ? 'rotate-180' : ''}"
      />
    </div>
  </button>

  {#if isOpen && availableModels.length > 0}
    <!-- 关键：小屏 fixed 贴边，md 起 absolute 相对按钮 -->
    <div
      class="dropdown fixed md:absolute top-[56px] md:top-full right-0 mt-2 z-[70]
             w-[min(18rem,calc(100vw-1rem))] md:w-64
             max-h-80 overflow-auto
             rounded-xl border border-gray-200 bg-white shadow-xl origin-top-right"
    >
      {#each availableModels as model}
        <button
          class="dropdown-item w-full flex items-center justify-between gap-2 px-3 py-2
                 hover:bg-gray-50 transition-colors
                 { $apiConfigStore.selectedModel === model ? 'bg-blue-50' : '' }"
          on:click={() => selectModel(model)}
        >
          <div class="model-info flex items-center gap-2 min-w-0">
            <Zap size={14} class="model-icon text-amber-500 shrink-0" />
            <span class="model-text text-sm text-gray-800 break-words">
              {model}
            </span>
          </div>
          {#if $apiConfigStore.selectedModel === model}
            <div class="check-mark text-blue-600">✓</div>
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