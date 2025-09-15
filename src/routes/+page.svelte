<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { chatStore } from '$lib/stores/chat';
  import { chatHistoryStore } from '$lib/stores/chat-history';
  import { apiConfigStore } from '$lib/stores/api-config';
  import { suggestions, setSuggestions, clearSuggestions } from '$lib/stores/suggestions';
  import { APIService } from '$lib/services/api';
  import { TOPIC_FIRST_MESSAGES } from '$lib/config';
  import { limitText } from '$lib/utils/markdown';
  import { Menu, Plus, Trash2 } from 'lucide-svelte';

  import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
  import ChatMessage from '$lib/components/ChatMessage.svelte';
  import TypingIndicator from '$lib/components/TypingIndicator.svelte';
  import SuggestionsPanel from '$lib/components/SuggestionsPanel.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import ModelSelector from '$lib/components/ModelSelector.svelte';
  
  let messagesContainer: HTMLElement;
  let showWelcome = true;
  let sidebarOpen = false;
  let settingsOpen = false;
  let isAtBottom = true;
  
  // 响应式状态
  $: hasMessages = $chatStore.messages.length > 0;
  $: showWelcome = !hasMessages;
  
  onMount(() => {
    // 加载存储的数据
    chatHistoryStore.loadFromStorage();
    apiConfigStore.loadFromStorage();
    
    // 如果有当前会话，加载它
    const currentSession = $chatHistoryStore.sessions.find(s => s.id === $chatHistoryStore.currentSessionId);
    if (currentSession) {
      chatStore.loadSession(currentSession.messages);
      showWelcome = currentSession.messages.length === 0;
    }
  });
  
  afterUpdate(() => {
    // 只有在底部时才自动滚动
    if (messagesContainer && messagesContainer.scrollHeight && isAtBottom) {
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  });
  
  function handleScroll() {
    if (!messagesContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const threshold = 50; // 50px threshold
    isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
  }
  
  async function handleTopicSelect(event: CustomEvent<string>) {
    const topic = event.detail;
    const firstMessage = TOPIC_FIRST_MESSAGES[topic];
    if (!firstMessage) return;
    
    const message = limitText(firstMessage);
    showWelcome = false;
    clearSuggestions();
    
    // 添加用户消息
    chatStore.addMessage('user', message);
    
    // 发送到API
    await sendToAPI(message);
  }
  
  async function handleCustomTopic() {
    showWelcome = false;
    clearSuggestions();
  }
  
  async function handleSendMessage(event: CustomEvent<string>) {
    const message = limitText(event.detail);
    showWelcome = false;
    clearSuggestions();
    isAtBottom = true; // 发送消息时确保滚动到底部
    
    // 添加用户消息
    chatStore.addMessage('user', message);
    
    // 发送到API
    await sendToAPI(message);
  }
  
  async function handleSuggestionSelect(event: CustomEvent<string>) {
    const suggestion = event.detail;
    await handleSendMessage(new CustomEvent('send', { detail: suggestion }));
  }
  
  async function sendToAPI(message: string) {
    try {
      chatStore.setGenerating(true);
      
      const controller = new AbortController();
      chatStore.setController(controller);
      
      let fullContent = '';
      
      // 使用流式 API
      for await (const chunk of APIService.streamChat($chatStore.messages, controller.signal)) {
        const piece =
          typeof chunk === 'string'
            ? chunk
            : chunk?.choices?.[0]?.delta?.content ?? '';

        if (!piece) continue;

        fullContent += piece;
        chatStore.patchLastAssistantContent(fullContent);
      }
      
      // 生成建议
      if (fullContent && fullContent.trim().length > 0) {
        await generateSuggestions(fullContent);
      }
      
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('请求被取消');
      } else {
        console.error('API请求错误:', error);
        chatStore.addMessage('assistant', '抱歉，服务器繁忙，请稍后再试。');
      }
    } finally {
      chatStore.setGenerating(false);
      chatStore.setController(null);
    }
  }
  
  async function generateSuggestions(lastResponse: string) {
    try {
      const newSuggestions = await APIService.generateSuggestions(lastResponse);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('生成建议失败:', error);
    }
  }
  
  function handleNewChat() {
    const sessionId = chatHistoryStore.createSession();
    chatStore.reset();
    showWelcome = true;
    clearSuggestions();
    isAtBottom = true;
  }
  
  function handleClearChat() {
    chatStore.clearMessages();
    clearSuggestions();
    isAtBottom = true;
  }
  
  function handleSelectSession(event: CustomEvent<string>) {
    const sessionId = event.detail;
    chatHistoryStore.selectSession(sessionId);
    
    const session = $chatHistoryStore.sessions.find(s => s.id === sessionId);
    if (session) {
      chatStore.loadSession(session.messages);
      showWelcome = session.messages.length === 0;
      clearSuggestions();
      
      // 如果最后一条消息是助手的，生成建议
      if (session.messages.length > 0) {
        const lastMessage = session.messages[session.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          generateSuggestions(lastMessage.content);
        }
      }
    }
    
    sidebarOpen = false;
  }
  
  function handleDeleteSession(event: CustomEvent<string>) {
    const sessionId = event.detail;
    chatHistoryStore.deleteSession(sessionId);
    
    // 如果删除的是当前会话，创建新会话
    if ($chatHistoryStore.currentSessionId === sessionId) {
      handleNewChat();
    }
  }
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
  
  function handleOpenSettings() {
    settingsOpen = true;
    sidebarOpen = false;
  }
  
  function handleCloseSettings() {
    settingsOpen = false;
  }
</script>

<svelte:head>
  <title>DeepSeek 智能助手</title>
  <meta name="description" content="DeepSeek AI智能助手，支持多种话题对话" />
</svelte:head>

<!-- Sidebar -->
<Sidebar 
  isOpen={sidebarOpen}
  on:newChat={handleNewChat}
  on:selectSession={handleSelectSession}
  on:deleteSession={handleDeleteSession}
  on:openSettings={handleOpenSettings}
/>

<!-- Settings Modal -->
<SettingsModal 
  isOpen={settingsOpen}
  on:close={handleCloseSettings}
/>

<!-- Sidebar Overlay -->
{#if sidebarOpen}
  <div class="sidebar-overlay" on:click={() => sidebarOpen = false}></div>
{/if}

<div class="app-container flex flex-col h-screen max-w-full mx-auto bg-white shadow-2xl border border-gray-100">
  <!-- Header -->
  <header class="header-bar bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg flex-shrink-0 relative z-10 md:relative fixed top-0 left-0 right-0 md:top-auto md:left-auto md:right-auto">
    <div class="header-left">
      <button class="menu-btn" on:click={toggleSidebar}>
        <Menu size={20} />
      </button>
      <div class="header-brand flex items-center space-x-3">
        <div class="brand-icon">
          <div class="icon-gradient"></div>
        </div>
        <h1 class="header-title">Intel AI 智能助手</h1>
        
        <!-- 移动到头部的操作按钮 -->
        <div class="header-actions hidden md:flex items-center space-x-2 ml-6">
          <button
            type="button"
            on:click={handleNewChat}
            class="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all duration-200 rounded-lg backdrop-blur-sm"
          >
            <Plus size={14} />
            <span>新对话</span>
          </button>
          
          {#if hasMessages}
            <button
              type="button"
              on:click={handleClearChat}
              class="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all duration-200 rounded-lg backdrop-blur-sm"
            >
              <Trash2 size={14} />
              <span>清空</span>
            </button>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="header-right">
      <ModelSelector />
    </div>
  </header>
  
  <!-- Chat Container -->
  <div class="chat-container flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-0 md:pb-0 pb-32 md:pt-0 pt-20">
    {#if showWelcome}
      <WelcomeScreen
        on:selectTopic={handleTopicSelect}
        on:customTopic={handleCustomTopic}
      />
    {:else}
      <div 
        bind:this={messagesContainer} 
        class="messages flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0 md:pb-6 pb-4"
        on:scroll={handleScroll}
      >
        {#each $chatStore.messages as message (message.id)}
          <ChatMessage {message} />
        {/each}
        
        {#if $chatStore.generating}
          <TypingIndicator />
        {/if}
      </div>
      
      <div class="suggestions-wrapper px-6 pb-4 flex-shrink-0">
        <SuggestionsPanel on:selectSuggestion={handleSuggestionSelect} />
      </div>
    {/if}
  </div>
  
  <!-- Input Section -->
  <div class="input-wrapper bg-white border-t border-gray-200 shadow-lg flex-shrink-0 relative z-10 md:relative md:bottom-auto fixed bottom-0 left-0 right-0">
    <ChatInput 
      disabled={$chatStore.generating}  
      on:send={handleSendMessage}
    />
    
    <!-- 移动端的操作按钮 -->
    <div class="mobile-actions md:hidden bg-gray-50 border-t border-gray-200 p-4">
      <div class="flex justify-between space-x-4">
        <button
          type="button"
          on:click={handleNewChat}
          class="flex items-center space-x-2 border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          <span>新对话</span>
        </button>
        
        <button
          type="button"
          on:click={handleClearChat}
          disabled={!hasMessages}
          class="flex items-center space-x-2 border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm hover:shadow-md"
        >
          <Trash2 size={16} />
          <span>清空对话</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .app-container {
    @apply w-full h-screen overflow-hidden;
  }
  
  .sidebar-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 z-30;
  }
  
  .header-bar {
    @apply flex items-center justify-between px-6 py-4 border-b border-blue-800/20;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
  }
  
  .header-left {
    @apply flex items-center space-x-3;
  }
  
  .header-brand {
    @apply flex items-center;
  }
  
  .brand-icon {
    @apply w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center relative overflow-hidden;
  }
  
  .icon-gradient {
    @apply w-4 h-4 rounded bg-gradient-to-br from-white to-blue-200;
  }
  
  .menu-btn {
    @apply p-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 rounded-lg backdrop-blur-sm;
  }
  
  .header-title {
    @apply text-xl font-bold text-white tracking-tight;
  }
  
  .header-right {
    @apply min-w-0 max-w-sm;
  }
  
  .header-actions {
    @apply flex items-center space-x-2;
  }
  
  .suggestions-wrapper {
    @apply relative;
  }
  
  .input-wrapper {
    @apply relative;
  }

  .mobile-actions {
    @apply md:hidden;
  }
</style>