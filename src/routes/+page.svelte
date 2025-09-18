<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import { chatStore } from "$lib/stores/chat";
  import { chatHistoryStore } from "$lib/stores/chat-history";
  import { apiConfigStore } from "$lib/stores/api-config";
  import {
    setSuggestions,
    clearSuggestions,
  } from "$lib/stores/suggestions";
  import { APIService } from "$lib/services/api";
  import { TOPIC_FIRST_MESSAGES } from "$lib/config";
  import { limitText } from "$lib/utils/markdown";
  import { Menu, Plus, Trash2 } from "lucide-svelte";

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

  // ✅ 并发代次：同一会话多次发送时的版本号
  const genBySession: Record<string, number> = {};

  // ✅ 用 Svelte store 包装 inflight Map（关键）
  const inflightMapStore = writable<
    Map<string, { controller: AbortController; gen: number }>
  >(new Map());

  $: hasMessages = $chatStore.messages.length > 0;
  $: showWelcome = !hasMessages;

  // ✅ 始终将“当前会话是否有流在跑”同步到全局 generating（用于输入禁用 & TypingIndicator）
  $: {
    const curId = $chatHistoryStore.currentSessionId;
    const busy = curId ? $inflightMapStore.has(curId) : false;
    chatStore.setGenerating(busy);
  }

  // 仅禁用“当前会话”的输入
  $: isCurrentSessionSending = (() => {
    const id = $chatHistoryStore.currentSessionId;
    if (!id) return false;
    return $inflightMapStore.has(id);
  })();

  function ensureCurrentSession() {
    const valid =
      $chatHistoryStore.currentSessionId &&
      $chatHistoryStore.sessions.find(
        (s) => s.id === $chatHistoryStore.currentSessionId,
      );
    if (!valid) chatHistoryStore.createSession();
  }

  function saveSession(targetId?: string) {
    const id = targetId ?? $chatHistoryStore.currentSessionId;
    if (id) chatHistoryStore.updateSession(id, $chatStore.messages);
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
    const msg = TOPIC_FIRST_MESSAGES[event.detail];
    if (!msg) return;
    await sendText(limitText(msg));
  }

  async function handleCustomTopic() {
    clearSuggestions();
  }

  async function handleSendMessage(event: CustomEvent<string>) {
    await sendText(limitText(event.detail));
  }

  async function handleSuggestionSelect(event: CustomEvent<string>) {
    await sendText(limitText(event.detail));
  }

  async function sendText(message: string) {
    ensureCurrentSession();
    clearSuggestions();
    isAtBottom = true;

    // 当前会话添加用户消息并落盘
    chatStore.addMessage("user", message);
    saveSession();

    // 启动该会话的流
    await sendToAPI();
  }

  // 🚦 每个会话各自的流（支持并发）
  async function sendToAPI() {
    const sessionId = $chatHistoryStore.currentSessionId;
    if (!sessionId) return;

    // bump 代次
    genBySession[sessionId] = (genBySession[sessionId] ?? 0) + 1;
    const myGen = genBySession[sessionId];

    // 工作快照
    const currentSession = $chatHistoryStore.sessions.find(
      (s) => s.id === sessionId,
    );
    let workingMessages = JSON.parse(
      JSON.stringify(currentSession?.messages ?? $chatStore.messages),
    );

    // 建立 controller 并登记到 inflightMapStore（返回新 Map 触发响应）
    const controller = new AbortController();
    inflightMapStore.update((m) => {
      const copy = new Map(m);
      copy.set(sessionId, { controller, gen: myGen });
      return copy;
    });

    // ❌ 不再直接 setGenerating(true)，由上面的响应式同步块接管

    let full = "";
    let reasoningFull = "";
    let started = false;
    let assistantMsgId: string | null = null;

    try {
      for await (const chunk of APIService.streamChat(
        workingMessages,
        controller.signal,
      )) {
        // 代次失效则终止
        if (genBySession[sessionId] !== myGen) {
          try { controller.abort(); } catch {}
          break;
        }

        const piece =
          typeof chunk === "string"
            ? chunk
            : (chunk?.choices?.[0]?.delta?.content ?? "");

        const rpiece =
          typeof chunk === "string"
            ? ""
            : (chunk?.choices?.[0]?.delta?.reasoning_content ?? "");

        if (!piece && !rpiece) continue;

        if (!started) {
          started = true;

          const nowISO = new Date().toISOString();
          assistantMsgId = crypto.randomUUID?.() ?? String(Date.now());

          const initialContent = piece || "";
          const initialReasoning = rpiece || "";

          // 写入 workingMessages
          workingMessages.push({
            id: assistantMsgId,
            role: "assistant",
            content: initialContent,
            createdAt: nowISO,
            updatedAt: nowISO,
            status: "streaming",
            meta: { reasoningContent: initialReasoning },
          });
          chatHistoryStore.updateSession(sessionId, workingMessages);

          // UI：新建助手消息 + 可选推理 meta（只作用当前会话）
          if ($chatHistoryStore.currentSessionId === sessionId) {
            chatStore.addMessage("assistant", initialContent);
            if (initialReasoning) {
              chatStore.patchLastAssistantMeta({
                reasoningContent: initialReasoning,
              });
            }
          }

          full = initialContent;
          reasoningFull = initialReasoning;
          continue;
        }

        // 非首段：累加 & patch
        if (piece) full += piece;
        if (rpiece) reasoningFull += rpiece;

        const lastIdx = workingMessages.length - 1;
        if (lastIdx >= 0 && workingMessages[lastIdx]?.role === "assistant") {
          if (piece) workingMessages[lastIdx].content = full;
          workingMessages[lastIdx].meta = workingMessages[lastIdx].meta || {};
          if (rpiece) {
            workingMessages[lastIdx].meta.reasoningContent = reasoningFull;
          }
          workingMessages[lastIdx].updatedAt = new Date().toISOString();
        }

        // 若用户仍在该会话：更新 UI；否则只更新会话存档
        if ($chatHistoryStore.currentSessionId === sessionId) {
          if (piece) chatStore.patchLastAssistantContent(full);
          if (rpiece)
            chatStore.patchLastAssistantMeta({ reasoningContent: reasoningFull });
        }
        chatHistoryStore.updateSession(sessionId, workingMessages);
      }

      // 结束：标记完成 & 生成建议
      if (started) {
        const lastIdx = workingMessages.length - 1;
        if (lastIdx >= 0 && workingMessages[lastIdx]?.role === "assistant") {
          workingMessages[lastIdx].status = "done";
          workingMessages[lastIdx].updatedAt = new Date().toISOString();
          chatHistoryStore.updateSession(sessionId, workingMessages);
        }
      }

      if (
        genBySession[sessionId] === myGen &&
        $chatHistoryStore.currentSessionId === sessionId &&
        full.trim()
      ) {
        try {
          const items = await APIService.generateSuggestions(full);
          if (Array.isArray(items) && items.length > 0) {
            setSuggestions(items);
          } else {
            setSuggestions(["能详细解释一下吗？", "有什么相关例子？", "还有其他建议吗？"]);
          }
        } catch (e) {
          console.error("生成建议失败:", e);
          setSuggestions(["能详细解释一下吗？", "有什么相关例子？", "还有其他建议吗？"]);
        }
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("API request error:", error);

        const errText = "抱歉，服务器繁忙，请稍后再试。";
        if (!started) {
          const nowISO = new Date().toISOString();
          workingMessages.push({
            id: crypto.randomUUID?.() ?? String(Date.now()),
            role: "assistant",
            content: errText,
            createdAt: nowISO,
            updatedAt: nowISO,
            status: "error",
          });
          chatHistoryStore.updateSession(sessionId, workingMessages);
          // 不手动 setGenerating(false)，由响应式同步块负责
          if ($chatHistoryStore.currentSessionId === sessionId) {
            chatStore.addMessage("assistant", errText);
          }
        } else {
          const lastIdx = workingMessages.length - 1;
          if (lastIdx >= 0 && workingMessages[lastIdx]?.role === "assistant") {
            workingMessages[lastIdx].content =
              (workingMessages[lastIdx].content ?? "") + "\n\n" + errText;
            workingMessages[lastIdx].status = "error";
            workingMessages[lastIdx].updatedAt = new Date().toISOString();
          } else {
            workingMessages.push({
              id: crypto.randomUUID?.() ?? String(Date.now()),
              role: "assistant",
              content: errText,
              createdAt: new Date().toISOString(),
              status: "error",
            });
          }
          chatHistoryStore.updateSession(sessionId, workingMessages);
          if ($chatHistoryStore.currentSessionId === sessionId) {
            chatStore.patchLastAssistantContent(
              workingMessages[lastIdx]?.content ?? errText,
            );
          }
        }
      }
    } finally {
      // 清理 inflight：用 store 触发响应
      inflightMapStore.update((m) => {
        const copy = new Map(m);
        const inflight = copy.get(sessionId);
        if (inflight && inflight.gen === myGen) copy.delete(sessionId);
        return copy;
      });
      // ❌ 不再直接 setGenerating(false)，由响应式同步块接管
    }
  }

  function handleNewChat() {
    const newId = chatHistoryStore.createSession();
    chatStore.reset();
    clearSuggestions();
    isAtBottom = true;
    // 生成态由响应式块自动根据 inflightMapStore 判定
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

      // 仅当该会话没有在跑流时生成建议
      if (session.messages.length > 0) {
        const last = session.messages[session.messages.length - 1];
        if (last.role === "assistant" && !$inflightMapStore.has(sessionId)) {
          (async () => {
            try {
              const items = await APIService.generateSuggestions(last.content ?? "");
              setSuggestions(items);
            } catch (e) {
              console.error("生成建议失败:", e);
            }
          })();
        }
      }
    }
    // 生成态由响应式块自动刷新，无需手动 setGenerating
  }

  function handleDeleteSession(event: CustomEvent<string>) {
    const sessionId = event.detail;

    // 若该会话有在跑的流，先中止
    const maybeMap = $inflightMapStore;
    const inflight = maybeMap.get(sessionId);
    if (inflight) {
      try { inflight.controller.abort(); } catch {}
      inflightMapStore.update((m) => {
        const copy = new Map(m);
        copy.delete(sessionId);
        return copy;
      });
    }

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
    <!-- Sidebar -->
    <aside
      id="app-sidebar"
      class={`flex h-full flex-col border-r border-gray-200 bg-white
      absolute inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300
      md:static md:inset-auto md:z-auto md:transform-none
      ${sidebarOpen ? "md:flex-none md:w-1/6" : "md:flex-none md:w-14"}
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
    >
      {#if !sidebarOpen}
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
      <div class="relative z-10 flex-shrink-0 md:mb-6 overflow-auto">
        <ChatInput
          disabled={isCurrentSessionSending || $chatStore.generating}
          on:send={handleSendMessage}
        />

        <!-- 移动端操作按钮 -->
        <div class="mt-4 border-t border-gray-200 bg-gray-50 p-3 lg:hidden">
          <div class="flex justify-between space-x-3">
            <button
              type="button"
              on:click={handleNewChat}
              class="flex items-center space-x-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              <span>新对话</span>
            </button>

            <button
              type="button"
              on:click={handleClearChat}
              disabled={!hasMessages || isCurrentSessionSending || $chatStore.generating}
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
