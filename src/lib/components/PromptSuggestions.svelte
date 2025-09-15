<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { promptSuggestions } from '../stores';
  import { Lightbulb } from 'lucide-svelte';

  const dispatch = createEventDispatcher<{
    select: { prompt: string };
  }>();

  function handlePromptSelect(prompt: string) {
    dispatch('select', { prompt });
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <!-- Welcome message -->
  <div class="text-center space-y-4">
    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
      <Lightbulb size="32" class="text-white" />
    </div>
    <h1 class="text-2xl font-bold text-white">AI ChatBot</h1>
    <p class="text-gray-400 max-w-md mx-auto">
      选择一个提示词开始对话，或者直接输入您的问题
    </p>
  </div>

  <!-- Prompt suggestions -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    {#each promptSuggestions as suggestion}
      <button
        on:click={() => handlePromptSelect(suggestion)}
        class="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] hover:border-blue-500 group"
      >
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <span class="text-gray-200 group-hover:text-white transition-colors">
            {suggestion}
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>
