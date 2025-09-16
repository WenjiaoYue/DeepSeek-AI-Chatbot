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
  class="selector-button group flex items-center gap-1 rounded px-1 py-0.5
         md:gap-2 md:px-3 md:py-2
         bg-white/30 md:hover:bg-white md:border md:border-gray-200 md:shadow-sm
         transition-colors"
  on:click|stopPropagation={toggleDropdown}
>
  <!-- 图标（只在桌面端显示） -->
  <div class="selector-icon shrink-0 grid place-items-center hidden md:block">
    <Cpu size={18} />
  </div>

  <!-- 文本区域（只在桌面端显示） -->
  <div class="selector-content hidden md:flex md:flex-col md:min-w-[10rem] md:max-w-[18rem]">
    <div class="config-name text-sm font-medium text-gray-900 break-words">
      {selectedConfig?.name || '未选择配置'}
    </div>
    <div class="model-name text-xs text-gray-500 break-words">
      {$apiConfigStore.selectedModel || '未选择模型'}
    </div>
  </div>

  <!-- 指示器 -->
  <div class="selector-indicator flex items-center gap-1">
    <div class="hidden md:block">
      <span class="inline-block h-2 w-2 rounded-full
                   {selectedConfig ? 'bg-emerald-500' : 'bg-gray-300'}"></span>
    </div>
    <ChevronDown
      size={16}
      class="chevron transition-transform duration-200 text-white md:text-gray-700 {isOpen ? 'rotate-180' : ''}"
    />
  </div>
</button>


  {#if isOpen && availableModels.length > 0}
    <div
      class="dropdown-menu"
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
    @apply p-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 rounded-lg backdrop-blur-sm;
  }
  
  /* 桌面端样式 */
  @media (min-width: 768px) {
    .selector-button {
      @apply flex items-center w-full px-4 py-3 bg-white/95 backdrop-blur-sm border border-white/40 text-left hover:bg-white hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg;
    }
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
    @apply text-white/80 group-hover:text-white;
  }
  
  /* 桌面端 chevron 颜色 */
  @media (min-width: 768px) {
    .chevron {
      @apply text-gray-600 group-hover:text-gray-800;
    }
  }
  
  .dropdown {
    @apply absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm rounded-xl;
  }
  
  .dropdown-menu {
    @apply fixed md:absolute z-[70] max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl;
    
    /* 移动端定位 */
    width: calc(100vw - 16px);
    max-width: 18rem;
    top: 60px;
    right: 8px;
  }
  
  /* 桌面端定位 */
  @media (min-width: 768px) {
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: auto;
      width: 16rem;
    }
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