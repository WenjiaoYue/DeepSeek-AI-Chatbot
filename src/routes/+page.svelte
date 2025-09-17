<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { chatStore } from "$lib/stores/chat";
  import { chatHistoryStore } from "$lib/stores/chat-history";
  import { apiConfigStore } from "$lib/stores/api-config";
  import {
    suggestions,
    setSuggestions,
    clearSuggestions,
  } from "$lib/stores/suggestions";
  import { APIService } from "$lib/services/api";
  import { TOPIC_FIRST_MESSAGES } from "$lib/config";
  import { limitText } from "$lib/utils/markdown";
  import { Menu, Plus, Trash2, Settings } from "lucide-svelte";

  import WelcomeScreen from "$lib/components/WelcomeScreen.svelte";
  import ChatMessage from "$lib/components/ChatMessage.svelte";
  import TypingIndicator from "$lib/components/TypingIndicator.svelte";
  import SuggestionsPanel from "$lib/components/SuggestionsPanel.svelte";
  import ChatInput from "$lib/components/ChatInput.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import SettingsModal from "$lib/components/SettingsModal.svelte";
  import ModelSelector from "$lib/components/ModelSelector.svelte";

  let messagesContainer: HTMLElement;
  let sidebarOpen = false;
  let settingsOpen = false;
  let isAtBottom = true;
  let isSending = false;

  $: hasMessages = $chatStore.messages.length > 0;
  $: showWelcome = !hasMessages;

  function ensureCurrentSession() {
    const valid =
      $chatHistoryStore.currentSessionId &&
      $chatHistoryStore.sessions.find(
        (s) => s.id === $chatHistoryStore.currentSessionId,
      );
    if (!valid) chatHistoryStore.createSession();
  }

  function saveSession() {
    if ($chatHistoryStore.currentSessionId) {
      chatHistoryStore.updateSession(
        $chatHistoryStore.currentSessionId,
        $chatStore.messages,
      );
    }
  }

  onMount(() => {
    chatHistoryStore.loadFromStorage();
    apiConfigStore.loadFromStorage();
    ensureCurrentSession();
    const current = $chatHistoryStore.sessions.find(
      (s) => s.id === $chatHistoryStore.currentSessionId,
    );
    if (current) chatStore.loadSession(current.messages);
  });

  afterUpdate(() => {
    if (messagesContainer && isAtBottom) {
      requestAnimationFrame(() => {
        if (messagesContainer?.scrollHeight != null) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  });

  function handleScroll() {
    if (!messagesContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
  }

  async function handleTopicSelect(event: CustomEvent<string>) {
    if (isSending) return;
    const msg = TOPIC_FIRST_MESSAGES[event.detail];
    if (!msg) return;
    await sendText(limitText(msg));
  }

  async function handleCustomTopic() {
    clearSuggestions();
  }
  async function handleSendMessage(event: CustomEvent<string>) {
    if (!isSending) await sendText(limitText(event.detail));
  }
  async function handleSuggestionSelect(event: CustomEvent<string>) {
    if (!isSending) await sendText(limitText(event.detail));
  }

  async function sendText(message: string) {
    ensureCurrentSession();
    clearSuggestions();
    isAtBottom = true;
    chatStore.addMessage("user", message);
    saveSession();
    await sendToAPI(message);
  }

  async function sendToAPI(message: string) {
    if (isSending) return;
    try {
      isSending = true;
      chatStore.setGenerating(true);
      const controller = new AbortController();
      chatStore.setController(controller);
      let full = "";
      for await (const chunk of APIService.streamChat(
        $chatStore.messages,
        controller.signal,
      )) {
        const piece =
          typeof chunk === "string"
            ? chunk
            : (chunk?.choices?.[0]?.delta?.content ?? "");
        if (!piece) continue;
        full += piece;
        chatStore.patchLastAssistantContent(full);
        saveSession();
      }
      if (full.trim()) await generateSuggestions(full);
      saveSession();
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("API request error:", error);
        chatStore.addMessage("assistant", "抱歉，服务器繁忙，请稍后再试。");
        saveSession();
      }
    } finally {
      chatStore.setGenerating(false);
      chatStore.setController(null);
      isSending = false;
    }
  }

  async function generateSuggestions(lastResponse: string) {
    try {
      const items = await APIService.generateSuggestions(lastResponse);
      setSuggestions(items);
    } catch (e) {
      console.error("生成建议失败:", e);
    }
  }

  function handleNewChat() {
    chatHistoryStore.createSession();
    chatStore.reset();
    clearSuggestions();
    isAtBottom = true;
  }

  function handleClearChat() {
    chatStore.clearMessages();
    clearSuggestions();
    isAtBottom = true;
    saveSession();
  }

  function handleSelectSession(event: CustomEvent<string>) {
    const sessionId = event.detail;
    saveSession();
    chatHistoryStore.selectSession(sessionId);
    const session = $chatHistoryStore.sessions.find((s) => s.id === sessionId);
    if (session) {
      chatStore.loadSession(session.messages);
      clearSuggestions();
      if (session.messages.length > 0) {
        const last = session.messages[session.messages.length - 1];
        if (last.role === "assistant") generateSuggestions(last.content);
      }
    }
  }

  function handleDeleteSession(event: CustomEvent<string>) {
    const sessionId = event.detail;
    const deletingCurrent = $chatHistoryStore.currentSessionId === sessionId;
    chatHistoryStore.deleteSession(sessionId);
    if (deletingCurrent) handleNewChat();
  }

  const toggleSidebar = () => (sidebarOpen = !sidebarOpen);
  const handleOpenSettings = () => (settingsOpen = true);
  const handleCloseSettings = () => (settingsOpen = false);
</script>

<svelte:head>
  <title>DeepSeek 智能助手</title>
  <meta name="description" content="DeepSeek AI智能助手，支持多种话题对话" />
</svelte:head>

<!-- 整体容器：头部 + 下方两栏布局 -->
<div
  class="mx-auto flex h-screen w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl"
>
  <!-- Header -->
  <header
    class="flex flex-shrink-0 items-center justify-between border-b border-blue-800/20 px-4 py-2 text-white"
    style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%)"
  >
    <div class="flex min-w-0 flex-1 items-center space-x-2 md:space-x-3">
      <button
        class="md:hidden rounded-lg p-2 text-white/80 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
        on:click={toggleSidebar}
        aria-controls="app-sidebar"
        aria-expanded={sidebarOpen}
        aria-label="打开侧边栏"
      >
        <Menu size={20} />
      </button>
      <div class="flex min-w-0 items-center">
        <div
          class="hidden h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/20 backdrop-blur-sm md:flex"
        >
          <div class="h-4 w-4 rounded bg-gradient-to-br from-white to-blue-200" />
        </div>
        <h1 class="truncate pl-3 text-lg font-bold tracking-tight md:text-xl">
          Deepseek 智能助手
        </h1>
      </div>
    </div>
    <div class="flex flex-shrink-0 items-center gap-2">
      <ModelSelector />
    </div>
  </header>

  <!-- Main Area: sidebar + chat -->
  <div class="relative flex min-h-0 flex-1 overflow-hidden">
    <!-- Sidebar：移动端抽屉 + 桌面端宽度切换 -->
    <aside
      id="app-sidebar"
      class={`flex h-full flex-col border-r border-gray-200 bg-white
      absolute inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300
      md:static md:inset-auto md:z-auto md:w-auto md:transform-none md:transition-all
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      ${sidebarOpen ? "md:basis-1/6 md:max-w-1/6" : "md:w-14 md:basis-14 md:max-w-14"}
    `}
    >
      {#if !sidebarOpen}
        <!-- 折叠态的小图标栏：仅桌面端可见 -->
        <div class="hidden h-full flex-col items-center justify-between py-3 md:flex">
          <button
            class="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            on:click={toggleSidebar}
            aria-label="打开侧边栏"
          >
            <Menu size={20} />
          </button>
        </div>
      {:else}
        <!-- 展开态：移动端抽屉内容 & 桌面端完整侧边栏 -->
        <Sidebar
          isOpen={sidebarOpen}
          on:newChat={handleNewChat}
          on:selectSession={handleSelectSession}
          on:deleteSession={handleDeleteSession}
          on:openSettings={handleOpenSettings}
          on:toggleSidebar={() => (sidebarOpen = !sidebarOpen)}
        />
      {/if}
    </aside>

    {#if sidebarOpen}
      <!-- 移动端遮罩：点击即可关闭（桌面端隐藏） -->
      <div
        class="fixed inset-0 z-30 bg-black/40 md:hidden"
        on:click={() => (sidebarOpen = false)}
        aria-hidden="true"
      />
    {/if}

    <!-- Chat 主区域 -->
    <main
      class="flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50"
    >
      {#if showWelcome}
        <WelcomeScreen
          on:selectTopic={handleTopicSelect}
          on:customTopic={handleCustomTopic}
        />
      {:else}
        <div
          bind:this={messagesContainer}
          class="custom-scrollbar flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-4 md:space-y-6 md:p-6"
          on:scroll={handleScroll}
        >
          {#each $chatStore.messages as message (message.id)}
            <ChatMessage {message} />
          {/each}

          {#if $chatStore.generating}
            <TypingIndicator />
          {/if}

          <div
            class="translate-y-0 px-4 pb-2 opacity-100 transition-all duration-300 md:px-6 md:pb-4"
          >
            <SuggestionsPanel on:selectSuggestion={handleSuggestionSelect} />
          </div>
        </div>
      {/if}

      <!-- Input Section -->
      <div
        class="relative z-10 flex-shrink-0 mb-6"
      >
        <ChatInput
          disabled={$chatStore.generating || isSending}
          on:send={handleSendMessage}
        />

        <!-- 移动端操作按钮 -->
        <div class="border-t border-gray-200 bg-gray-50 p-3 lg:hidden">
          <div class="flex justify-between space-x-3">
            <button
              type="button"
              on:click={handleNewChat}
              class="flex items-center space-x-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={14} />
              <span>新对话</span>
            </button>

            <button
              type="button"
              on:click={handleClearChat}
              disabled={!hasMessages}
              class="flex items-center space-x-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>清空对话</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<!-- 设置弹窗 -->
<SettingsModal isOpen={settingsOpen} on:close={handleCloseSettings} />
