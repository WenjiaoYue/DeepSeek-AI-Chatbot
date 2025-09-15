<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { chatStore } from '$lib/stores/chat';
  import { suggestions, setSuggestions, clearSuggestions } from '$lib/stores/suggestions';
  import { APIService } from '$lib/services/api';
  import { TOPIC_FIRST_MESSAGES } from '$lib/config';
  import { limitText } from '$lib/utils/markdown';
  
  import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
  import ChatMessage from '$lib/components/ChatMessage.svelte';
  import TypingIndicator from '$lib/components/TypingIndicator.svelte';
  import SuggestionsPanel from '$lib/components/SuggestionsPanel.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import ActionButtons from '$lib/components/ActionButtons.svelte';
  
  let messagesContainer: HTMLElement;
  let showWelcome = true;
  
  // 响应式状态
  $: hasMessages = $chatStore.messages.length > 0;
  $: showWelcome = !hasMessages;
  
  onMount(() => {
    // 如果有消息历史，隐藏欢迎屏幕
    if (hasMessages) {
      showWelcome = false;
      // 如果最后一条消息是助手的，生成建议
      const lastMessage = $chatStore.messages[$chatStore.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        generateSuggestions(lastMessage.content);
      }
    }
  });
  
  afterUpdate(() => {
    // 自动滚动到底部
    if (messagesContainer) {
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
    chatStore.reset();
    showWelcome = true;
    clearSuggestions();
  }
  
  function handleClearChat() {
    chatStore.clearMessages();
    clearSuggestions();
  }
</script>

<svelte:head>
  <title>DeepSeek 智能助手</title>
  <meta name="description" content="DeepSeek AI智能助手，支持多种话题对话" />
</svelte:head>

<div class="app-container flex flex-col h-screen max-w-full mx-auto bg-white dark:bg-gray-900 shadow-2xl">
  <!-- Header -->
  <header class="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-4 text-center shadow-lg">
    <h1 class="text-2xl font-bold">DeepSeek 智能助手</h1>
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
  }
  
  @media (min-width: 768px) {
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      border-radius: 1rem;
      overflow: hidden;
    }
  }
</style>