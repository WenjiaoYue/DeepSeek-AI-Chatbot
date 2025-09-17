<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { chatHistoryStore } from "../stores/chat-history";
  import {
    Plus,
    MessageSquare,
    Trash2,
    Settings,
    ChevronsLeft,
    ChevronsRight,
  } from "lucide-svelte";

  const dispatch = createEventDispatcher<{
    newChat: void;
    selectSession: string;
    deleteSession: string;
    openSettings: void;
    toggleSidebar: void;
  }>();

  export let isOpen = false;

  function handleNewChat() {
    dispatch("newChat");
  }
  function handleSelectSession(id: string) {
    dispatch("selectSession", id);
  }
  // 删除：直接删除，无确认
  function handleDeleteSession(id: string, event?: Event) {
    event?.stopPropagation();
    dispatch("deleteSession", id);
  }
  function handleOpenSettings() {
    dispatch("openSettings");
  }
  function handleToggleSidebar() {
    dispatch("toggleSidebar");
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  }
</script>

{#if !isOpen}
  <!-- 收起态：左侧热区；仅悬浮时显示双箭头展开 -->
  <div
    class="group/edge fixed left-0 top-1/2 z-[60] -translate-y-1/2 hidden md:block"
  >
    <div class="h-24 w-2"></div>
    <button
      class="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 translate-x-[-50%]
             rounded-full bg-white/90 p-1.5 shadow-md ring-1 ring-black/5 opacity-0
             transition-opacity group-hover/edge:opacity-100 hover:bg-white"
      aria-label="展开侧边栏"
      title="展开"
      type="button"
      on:click={handleToggleSidebar}
    >
      <ChevronsRight size={16} />
    </button>
  </div>
{/if}

{#if isOpen}
  <!-- 移动端遮罩（不拦截触摸，避免遮到侧栏） -->
  <div
    class="fixed inset-0 z-40 bg-black/30 pointer-events-none transition-opacity lg:hidden"
    aria-hidden="true"
  />
{/if}

<!-- 侧边栏本体：给 nav 一个 group 以便 hover 时显示“收起”按钮 -->
<nav
  aria-label="历史对话侧边栏"
  class="
    group/sidebar
    z-50 transition-transform duration-300 will-change-transform
    border-r border-gray-200 bg-white shadow-2xl
    flex h-full flex-col
    fixed inset-y-0 left-0 w-72 lg:relative lg:inset-auto lg:w-full
    lg:shadow-none lg:translate-x-0
  "
  class:-translate-x-full={!isOpen}
>
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 p-4"
  >
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm hover:bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      on:click={handleNewChat}
      aria-label="新建对话"
    >
      <Plus size={16} />
      <span>新对话</span>
    </button>

    <button
      type="button"
      class="hidden md:inline-flex rounded-lg p-2 text-slate-600 hover:bg-white/60 hover:text-slate-800
         opacity-0 transition-opacity
         lg:group-hover/sidebar:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500"
      on:click={handleToggleSidebar}
      aria-label="收起侧边栏"
      title="收起"
    >
      <ChevronsLeft size={16} />
    </button>
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="rounded-lg p-2 text-slate-600 hover:bg-white/60 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        on:click={handleOpenSettings}
        aria-label="打开设置"
        title="设置"
      >
        <Settings size={16} />
        <span class="sr-only">设置</span>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50">
    <h2 class="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-gray-800 md:hidden">
      历史对话
    </h2>

    <div class="mt-3 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
      {#each $chatHistoryStore.sessions as session (session.id)}
        <div
          tabindex="0"
          aria-pressed={$chatHistoryStore.currentSessionId === session.id}
          role="button"
          class="cursor-pointer select-none group flex items-center justify-between rounded-lg border border-transparent p-3 text-left outline-none transition
                 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm
                 focus-visible:ring-2 focus-visible:ring-blue-500
                 {$chatHistoryStore.currentSessionId === session.id
                   ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm'
                   : ''}"
          style="touch-action: manipulation"      
          on:click={() => handleSelectSession(session.id)}   
          on:touchend|preventDefault={() => handleSelectSession(session.id)}  
          on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleSelectSession(session.id)
          }
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <MessageSquare size={14} class="shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="truncate leading-tight text-xs font-medium text-gray-900">
                {session.title}
              </div>
              <div class="truncate text-[0.6rem] text-gray-500 mt-1">
                {formatDate(session.updatedAt)}
              </div>
            </div>
          </div>

          <!-- 删除按钮（无确认），在移动端也不拦截父节点 -->
          <button
            type="button"
            class="rounded p-1 text-gray-400 opacity-0 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
            title="删除"
            aria-label="删除对话"
            on:click={(e) => handleDeleteSession(session.id, e)}
            on:touchend|stopPropagation|preventDefault={(e) => handleDeleteSession(session.id, e)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      {/each}

      {#if $chatHistoryStore.sessions.length === 0}
        <div class="flex flex-col items-center justify-center py-10 text-gray-500">
          <MessageSquare size={24} />
          <span class="mt-2 text-sm">暂无历史对话</span>
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  /* 可选：iOS 点击高亮优化 */
  [role="button"] { -webkit-tap-highlight-color: rgba(0,0,0,0.08); }
</style>
