<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { chatStore } from './lib/stores/chat';
  import { chatHistoryStore } from './lib/stores/chat-history';
  import { apiConfigStore } from './lib/stores/api-config';
  import { suggestions, setSuggestions, clearSuggestions } from './lib/stores/suggestions';
  import { APIService } from './lib/services/api';
  import { TOPIC_FIRST_MESSAGES } from './lib/config';
  import { limitText } from './lib/utils/markdown';
  import { Menu } from 'lucide-svelte';
  
  import WelcomeScreen from './lib/components/WelcomeScreen.svelte';
  import ChatMessage from './lib/components/ChatMessage.svelte';
  import TypingIndicator from './lib/components/TypingIndicator.svelte';
  import SuggestionsPanel from './lib/components/SuggestionsPanel.svelte';
  import ChatInput from './lib/components/ChatInput.svelte';
  import ActionButtons from './lib/components/ActionButtons.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';
  import ModelSelector from './lib/components/ModelSelector.svelte';
  
  let messagesContainer: HTMLElement;
  let showWelcome = true;
  let sidebarOpen = false;
  let settingsOpen = false;
  
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
    // 自动滚动到底部
    if (messagesContainer && messagesContainer.scrollHeight) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  });
  
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
      
      // 创建AbortController
      const controller = new AbortController();
      chatStore.setController(controller);
      
      let fullContent = '';
      
      // 使用流式API
      for await (const chunk of APIService.streamChat($chatStore.messages, controller.signal)) {
        fullContent += chunk;
        
        // 实时更新最后一条消息，如果不存在则创建
        if ($chatStore.messages[$chatStore.messages.length - 1]?.role !== 'assistant') {
          chatStore.addMessage('assistant', fullContent);
        } else {
          // 更新最后一条消息
          chatStore.update(state => {
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1].content = fullContent;
            return {
              ...state,
              messages: newMessages
            };
          });
        }
      }
      
      // 生成建议
      await generateSuggestions(fullContent);
      
    } catch (error) {
      if (error.name === 'AbortError') {
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
  }
  
  function handleClearChat() {
    chatStore.clearMessages();
    clearSuggestions();
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

<div class="app-container flex flex-col h-screen max-w-full mx-auto bg-white shadow-lg">
  <!-- Header -->
  <header class="header-bar">
    <div class="header-left">
      <button class="menu-btn" on:click={toggleSidebar}>
        <Menu size={20} />
      </button>
      <h1 class="header-title">Intel AI 助手</h1>
    </div>
    
    <div class="header-right">
      <ModelSelector />
    </div>
  </header>
  
  <!-- Chat Container -->
  <div class="chat-container flex-1 overflow-hidden flex flex-col">
    {#if showWelcome}
      <WelcomeScreen
        on:selectTopic={handleTopicSelect}
        on:customTopic={handleCustomTopic}
      />
    {:else}
      <div bind:this={messagesContainer} class="messages flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {#each $chatStore.messages as message (message.timestamp)}
          <ChatMessage {message} />
        {/each}
        
        {#if $chatStore.isGenerating}
          <TypingIndicator />
        {/if}
      </div>
      
      <SuggestionsPanel on:selectSuggestion={handleSuggestionSelect} />
    {/if}
  </div>
  
  <!-- Input Section -->
  <ChatInput 
    disabled={$chatStore.isGenerating}
    on:send={handleSendMessage}
  />
  
  <!-- Action Buttons -->
  <ActionButtons 
    {hasMessages}
    on:newChat={handleNewChat}
    on:clearChat={handleClearChat}
  />
</div>

<style>
  .app-container {
    max-height: 100vh;
    border: 1px solid #e5e7eb;
  }
  
  .sidebar-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 z-30;
  }
  
  .header-bar {
    @apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200;
  }
  
  .header-left {
    @apply flex items-center space-x-3;
  }
  
  .menu-btn {
    @apply p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors;
  }
  
  .header-title {
    @apply text-xl font-semibold text-gray-900;
  }
  
  .header-right {
    @apply min-w-0 max-w-xs;
  }
</style>
