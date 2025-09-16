<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { chatHistoryStore } from '../stores/chat-history';
  import {
    Plus,
    MessageSquare,
    Trash2,
    Settings,
    ChevronsLeft,   // ✅ 改：收起时用双箭头
    ChevronsRight,  // ✅ 新增：展开时用双箭头
    Pencil          // ✅ 新增：编辑图标
  } from 'lucide-svelte';

  const dispatch = createEventDispatcher<{
    newChat: void;
    selectSession: string;
    deleteSession: string;
    openSettings: void;
    toggleSidebar: void;
    renameSession: { id: string; title: string }; // ✅ 新增：重命名事件
  }>();

  export let isOpen = false;

  // ✅ 新增：编辑状态
  let editingId: string | null = null;
  let draftTitle = '';

  function handleNewChat() {
    dispatch('newChat');
  }
  function handleSelectSession(id: string) {
    dispatch('selectSession', id);
  }
  // ✅ 改：删除直接执行，无弹窗
  function handleDeleteSession(id: string, event: Event) {
    event.stopPropagation();
    dispatch('deleteSession', id);
  }
  function handleOpenSettings() {
    dispatch('openSettings');
  }
  function handleToggleSidebar() {
    dispatch('toggleSidebar');
  }

  // ✅ 新增：开始编辑 / 保存 / 取消
  function startEdit(session: { id: string; title: string }, event?: Event) {
    event?.stopPropagation();
    editingId = session.id;
    draftTitle = session.title;
  }
  function commitEdit(id: string) {
    const title = draftTitle.trim();
    if (title && title !== getTitleById(id)) {
      dispatch('renameSession', { id, title });
    }
    editingId = null;
  }
  function cancelEdit() {
    editingId = null;
  }
  function onEditKeydown(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }
  function getTitleById(id: string) {
    return chatHistoryStore.get().sessions.find((s) => s.id === id)?.title ?? '';
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  }
</script>

<!-- ✅ 新增：折叠时的“边缘热区 + 双箭头”展开按钮（仅折叠状态显示，悬浮才显现） -->
{#if !isOpen}
  <div class="group/edge fixed left-0 top-1/2 z-[60] -translate-y-1/2 lg:hidden">
    <!-- 热区：便于 hover -->
    <div class="h-24 w-2"></div>
    <button
      class="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 translate-x-[-50%]
             rounded-full bg-white/90 p-1.5 shadow-md ring-1 ring-black/5 opacity-0
             transition-opacity group-hover/edge:opacity-100 hover:bg-white"
      aria-label="展开侧边栏"
      title="展开"
      on:click={handleToggleSidebar}
    >
      <ChevronsRight size={16} />
    </button>
  </div>
{/if}

<!-- Overlay（仅移动端显示；桌面为内联布局不需要遮罩） -->
{#if isOpen}
  <div
    class="fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden"
    aria-hidden="true"
  />
{/if}

<!-- Sidebar：移动端 = 抽屉；桌面 = 内联 -->
<nav
  aria-label="历史对话侧边栏"
  class="
    z-50 transition-transform duration-300 will-change-transform
    border-r border-gray-200 bg-white shadow-2xl
    flex h-full flex-col
    fixed inset-y-0 left-0 w-72 lg:relative lg:inset-auto lg:w-full
    lg:shadow-none
    lg:translate-x-0
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

    <!-- ✅ 改：收起按钮使用双箭头（桌面 & 移动端） -->
    <button
      type="button"
      class="rounded-lg p-2 text-slate-600 hover:bg-white/60 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
    <h2 class="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-gray-800">历史对话</h2>

    <div class="mt-3 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
      {#each $chatHistoryStore.sessions as session (session.id)}
        <div
          role="button"
          tabindex="0"
          aria-pressed={$chatHistoryStore.currentSessionId === session.id}
          class="group flex items-center justify-between rounded-lg border border-transparent p-3 text-left outline-none transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 { $chatHistoryStore.currentSessionId === session.id ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm' : '' }"
          on:click={() => handleSelectSession(session.id)}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectSession(session.id)}
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <MessageSquare size={14} class="shrink-0" />
            <div class="min-w-0 flex-1">
              {#if editingId === session.id}
                <!-- ✅ 编辑态：输入框 + 保存/取消（Enter 保存，Esc 取消，Blur 保存） -->
                <input
                  class="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  bind:value={draftTitle}
                  on:click|stopPropagation
                  on:keydown={(e) => onEditKeydown(e, session.id)}
                  on:blur={() => commitEdit(session.id)}
                  autofocus
                  aria-label="编辑会话名称"
                />
              {:else}
                <div class="truncate leading-tight text-sm font-medium text-gray-900">
                  {session.title}
                </div>
                <div class="truncate text-xs text-gray-500">
                  {formatDate(session.updatedAt)}
                </div>
              {/if}
            </div>
          </div>

          <div class="ml-2 flex items-center gap-1">
            <!-- ✅ 新增：编辑按钮（hover/聚焦显示） -->
            {#if editingId !== session.id}
              <button
                type="button"
                class="rounded p-1 text-gray-400 opacity-0 hover:text-blue-600 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                on:click={(e) => startEdit(session, e)}
                aria-label="重命名会话"
                title="重命名"
              >
                <Pencil size={12} />
              </button>
            {/if}

            <!-- ✅ 改：删除按钮无确认弹窗 -->
            <button
              type="button"
              class="rounded p-1 text-gray-400 opacity-0 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
              on:click={(e) => handleDeleteSession(session.id, e)}
              aria-label="删除对话"
              title="删除"
            >
              <Trash2 size={12} />
            </button>
          </div>
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
