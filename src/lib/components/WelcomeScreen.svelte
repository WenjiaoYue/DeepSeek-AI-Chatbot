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

<div class="welcome-container flex flex-col items-center justify-start h-full p-6 text-center overflow-y-auto custom-scrollbar animate-fade-in">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-3">
      欢迎使用 Intel AI 智能助手
    </h2>
    <p class="text-gray-600 text-lg">
      选择一个话题开始聊天
    </p>
  </div>
  
  <div class="w-full max-w-4xl space-y-8">
    <!-- 实用主题 -->
    <div class="topic-section">
      <h3 class="text-xl font-semibold text-gray-800 mb-4 relative">
        {TOPIC_CATEGORIES.practical.title}
        <div class="w-12 h-1 bg-blue-500 mx-auto mt-2"></div>
      </h3>
      <div class="flex flex-wrap justify-center gap-3">
        {#each TOPIC_CATEGORIES.practical.topics as topic}
          <button
            class="topic-btn topic-btn-primary"
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- 娱乐主题 -->
    <div class="topic-section">
      <h3 class="text-xl font-semibold text-gray-800 mb-4 relative">
        {TOPIC_CATEGORIES.entertainment.title}
        <div class="w-12 h-1 bg-green-500 mx-auto mt-2"></div>
      </h3>
      <div class="flex flex-wrap justify-center gap-3">
        {#each TOPIC_CATEGORIES.entertainment.topics as topic}
          <button
            class="topic-btn topic-btn-fun"
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </div>
    
  </div>
</div>

<style>
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