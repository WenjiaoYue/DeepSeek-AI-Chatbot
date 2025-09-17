<script lang="ts">
  import { apiConfigStore } from '../stores/api-config';
  import { ChevronDown, Cpu, Zap } from 'lucide-svelte';

  let isOpen = false;

  // 选中配置与可用模型
  $: selectedConfig = $apiConfigStore.configs.find(
    (c) => c.id === $apiConfigStore.selectedConfigId
  );
  $: availableModels = selectedConfig?.models || [];

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectModel(model: string) {
    apiConfigStore.selectModel(model);
    isOpen = false;
  }

  // 点击组件外关闭
  function handlePointerDownOutside(event: PointerEvent) {
    const target = event.target as Element;
    if (!target.closest('[data-model-selector]')) {
      isOpen = false;
    }
  }

  // iOS 双击缩放兜底：仅在第二次点按时阻止默认，不做状态切换（避免与 pointerup 重复）
  let lastTap = 0;
  function onTouchEnd(e: TouchEvent) {
    const now = Date.now();
    if (now - lastTap < 350) {
      e.preventDefault();
    }
    lastTap = now;
  }
</script>

<!-- 用 pointer 事件监听窗口外部点击 -->
<svelte:window on:pointerdown={handlePointerDownOutside} />

<div data-model-selector class="relative z-[60]">
  <button
    id="model-trigger"
    type="button"
    on:pointerup|stopPropagation={toggleDropdown}
    on:touchend={onTouchEnd}
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-controls="model-menu"
    class="group inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/30 px-2 py-1 text-base text-white/80 backdrop-blur-sm transition-all hover:bg-white/40 hover:text-white
           md:w-auto md:gap-3 md:border-gray-200 md:bg-white md:px-4 md:py-3 md:text-gray-700 md:shadow-sm md:hover:border-gray-300 md:hover:bg-white md:hover:text-gray-900"
  >
    <!-- 图标（桌面端） -->
    <div class="hidden md:grid shrink-0 place-items-center text-gray-700">
      <Cpu size={18} />
    </div>

    <!-- 文本区域（桌面端） -->
    <div class="hidden md:flex md:flex-col md:min-w-[10rem] md:max-w-[18rem]">
      <div class="truncate text-sm font-medium text-gray-900">
        {selectedConfig?.name || '未选择配置'}
      </div>
      <div class="truncate text-xs text-gray-500">
        {$apiConfigStore.selectedModel || '未选择模型'}
      </div>
    </div>

    <!-- 指示器 -->
    <div class="flex items-center gap-2">
      <span
        class="hidden md:inline-block h-2 w-2 rounded-full {selectedConfig ? 'bg-emerald-500' : 'bg-gray-300'}"
      />
      <ChevronDown
        size={16}
        class="transition-transform duration-200 text-white group-hover:text-white md:text-gray-600 md:group-hover:text-gray-800 {isOpen ? 'rotate-180' : ''}"
      />
    </div>
  </button>

  {#if isOpen && availableModels.length > 0}
    <div
      id="model-menu"
      role="menu"
      aria-label="模型列表"
      class="fixed right-2 top-[60px] z-[70] max-h-80 w-[calc(100vw-16px)] overflow-auto rounded-xl border border-gray-200 bg-white/95 p-1 shadow-xl backdrop-blur-sm
             md:absolute md:left-0 md:right-auto md:top-[calc(100%+8px)] md:w-64"
    >
      {#each availableModels as model}
        <button
          role="menuitem"
          on:pointerup={() => selectModel(model)}
          on:touchend={onTouchEnd}
          class="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 { $apiConfigStore.selectedModel === model ? 'bg-blue-50' : '' }"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Zap size={14} class="shrink-0 text-amber-500" />
            <span class="truncate">{model}</span>
          </div>
          {#if $apiConfigStore.selectedModel === model}
            <span aria-hidden="true" class="text-blue-600">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* 把触控视为“点按”，抑制双击缩放/手势冲突 */
  :global([data-model-selector] button) {
    touch-action: manipulation;
  }

  /* （可选）提升移动端可点区域，避免贴边误触手势区 */
  :global([data-model-selector] #model-trigger) {
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }
</style>