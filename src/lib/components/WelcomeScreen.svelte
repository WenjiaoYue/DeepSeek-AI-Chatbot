<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TOPIC_CATEGORIES } from '../config';
  
  const dispatch = createEventDispatcher<{
    selectTopic: string;
    customTopic: void;
  }>();
  
  function handleTopicSelect(topic: string) {
    dispatch('selectTopic', topic);
  }
</script>

<div class="welcome-container flex flex-col items-center justify-center h-full p-4 md:p-8 text-center overflow-y-auto custom-scrollbar animate-fade-in">
  <div class="mb-4 md:mb-8">
    <div class="welcome-icon mb-4 md:mb-6">
      <div class="icon-circle">
        <div class="icon-inner"></div>
      </div>
    </div>
    <h2 class="text-xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-4">
      欢迎使用 Deepseek 智能助手
    </h2>
    <p class="text-gray-600 text-sm md:text-lg font-medium">
      选择一个话题开始聊天
    </p>
  </div>
  
  <div class="w-full max-w-4xl space-y-4 md:space-y-8">
    <!-- 实用主题 -->
    <div class="topic-section">
      <!-- <h3 class="text-base md:text-2xl font-bold text-gray-800 mb-3 md:mb-6 relative">
        {TOPIC_CATEGORIES.practical.title}
        <div class="w-8 md:w-16 h-0.5 md:h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mt-1 md:mt-3 rounded-full"></div>
      </h3> -->
      <div class="flex flex-wrap justify-center gap-2 md:gap-4">
        {#each TOPIC_CATEGORIES.practical.topics as topic}
          <button
            class="topic-btn topic-btn-primary text-xs md:text-sm"
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- <div class="topic-section">
      <h3 class="text-base md:text-2xl font-bold text-gray-800 mb-3 md:mb-6 relative">
        {TOPIC_CATEGORIES.entertainment.title}
        <div class="w-8 md:w-16 h-0.5 md:h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mt-1 md:mt-3 rounded-full"></div>
      </h3>
      <div class="flex flex-wrap justify-center gap-2 md:gap-4">
        {#each TOPIC_CATEGORIES.entertainment.topics as topic}
          <button
            class="topic-btn topic-btn-fun text-xs md:text-sm"
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </div> -->
    
  </div>
</div>

<style>

  .icon-circle {
  @apply w-16 md:w-20 h-16 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.6);
  }
}

  .welcome-icon {
    @apply flex justify-center;
  }
  
  
  .icon-inner {
    @apply w-8 md:w-10 h-8 md:h-10 rounded-full bg-white/30 backdrop-blur-sm;
  }
  
  .topic-section {
    @apply animate-slide-in;
  }
  
  .topic-section:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .topic-section:nth-child(3) {
    animation-delay: 0.2s;
  }
  
  .topic-section:nth-child(4) {
    animation-delay: 0.3s;
  }
</style>