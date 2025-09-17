<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TOPIC_CATEGORIES, TOPIC_FIRST_MESSAGES } from '$lib/config';

  const dispatch = createEventDispatcher<{
    selectTopic: string;
    customTopic: void;
  }>();

  function handleTopicSelect(topic: string) {
    dispatch('selectTopic', topic);
  }
</script>

<div class="flex flex-1 min-h-0 flex-col items-center p-4 text-center md:p-8 overflow-y-auto">
  <div class="mb-4 md:mb-8">
    <div class="mb-4 flex justify-center md:mb-6">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl md:h-20 md:w-20 animate-pulse">
        <div class="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm md:h-10 md:w-10" />
      </div>
    </div>

    <h2 class="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent md:mb-4 md:text-4xl">
      欢迎使用 Deepseek 智能助手
    </h2>
    <p class="text-[0.7rem] font-medium text-gray-600 md:text-lg">
      选择一个话题开始聊天
    </p>
  </div>

  <div class="w-full max-w-4xl space-y-4 md:space-y-8">
    <!-- 实用主题 -->
    <section class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-4 shadow-lg backdrop-blur md:p-6">
      <h3 class="mb-3 text-center text-sm font-semibold text-blue-800 md:mb-4 md:text-base">
        {TOPIC_CATEGORIES.practical.title ?? '实用主题'}
      </h3>
      <div class="flex flex-wrap justify-center gap-2 md:gap-3">
        {#each TOPIC_CATEGORIES.practical.topics as topic}
          <button
            type="button"
            aria-label={`选择话题 ${topic}`}
            class="inline-flex items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-blue-600 active:scale-95 focus:ring-2 focus:ring-blue-300 md:px-4 md:py-2 md:text-sm"
            title={TOPIC_FIRST_MESSAGES?.[topic] ?? ''}
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </section>

    <!-- 轻松娱乐 -->
    <section class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-lg backdrop-blur md:p-6">
      <h3 class="mb-3 text-center text-sm font-semibold text-emerald-800 md:mb-4 md:text-base">
        {TOPIC_CATEGORIES.entertainment.title ?? '轻松娱乐'}
      </h3>
      <div class="flex flex-wrap justify-center gap-2 md:gap-3">
        {#each TOPIC_CATEGORIES.entertainment.topics as topic}
          <button
            type="button"
            aria-label={`选择话题 ${topic}`}
            class="inline-flex items-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all hover:scale-[1.02] hover:from-emerald-700 hover:to-emerald-600 active:scale-95 focus:ring-2 focus:ring-emerald-300 md:px-4 md:py-2 md:text-sm"
            title={TOPIC_FIRST_MESSAGES?.[topic] ?? ''}
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </section>

    <!-- 角色扮演 -->
    <section class="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-white p-4 shadow-lg backdrop-blur md:p-6">
      <h3 class="mb-3 text-center text-sm font-semibold text-purple-800 md:mb-4 md:text-base">
        {TOPIC_CATEGORIES.roleplay.title ?? '角色扮演'}
      </h3>
      <div class="flex flex-wrap justify-center gap-2 md:gap-3">
        {#each TOPIC_CATEGORIES.roleplay.topics as topic}
          <button
            type="button"
            aria-label={`选择话题 ${topic}`}
            class="inline-flex items-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all hover:scale-[1.02] hover:from-purple-700 hover:to-purple-600 active:scale-95 focus:ring-2 focus:ring-purple-300 md:px-4 md:py-2 md:text-sm"
            title={TOPIC_FIRST_MESSAGES?.[topic] ?? ''}
            on:click={() => handleTopicSelect(topic)}
          >
            {topic}
          </button>
        {/each}
      </div>
    </section>

    <p class="mt-1 text-[9px] leading-tight text-gray-400 text-center select-text">
      后台算力由 Intel Gaudi AI 加速卡提供, 客户端服务由 DeepSeek 大模型自动代码生成。<br />
      本服务仅用于功能演示，具体服务时间以系统实际运行为准，终止服务时将不再另行公告。感谢您的理解与支持。
    </p>
  </div>
</div>
