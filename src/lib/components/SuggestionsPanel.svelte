<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { suggestions } from '../stores/suggestions';
  
  const dispatch = createEventDispatcher<{
    selectSuggestion: string;
  }>();
  
  function handleSuggestionClick(suggestion: string) {
    dispatch('selectSuggestion', suggestion);
  }

  let showSuggestions = true;

function closeSuggestions() {
  showSuggestions = false;
}

</script>

{#if showSuggestions && $suggestions.length > 0}
  <div class="suggestions-container relative p-3 md:p-6 animate-fade-in">
    <button 
      class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition"
      on:click={closeSuggestions}
    >
      ✕
    </button>

    <div class="suggestions-title text-center mb-2 md:mb-4">
      <span class="text-xs md:text-sm font-medium text-indigo-600">💡 您可能想问</span>
    </div>

    <div class="flex flex-wrap justify-center gap-2 md:gap-3">
      {#each $suggestions as suggestion}
        <button
          class="suggestion-chip group transform transition-all duration-300 hover:scale-105 active:scale-95"
          on:click={() => handleSuggestionClick(suggestion)}
        >
          <div class="suggestion-content">
            <span class="suggestion-text text-xs md:text-sm">{suggestion}</span>
            <div class="suggestion-glow"></div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .suggestions-container {
    @apply bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200;
    border-radius: 12px;
  }
  
  .suggestion-chip {
    @apply relative bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 px-3 md:px-5 py-2 md:py-3 font-medium text-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 overflow-hidden;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
    transition: all 0.3s ease;
  }
  
  .suggestion-chip:hover {
    @apply from-indigo-100 to-blue-100 border-indigo-300 text-indigo-800;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
  }
  
  .suggestion-content {
    @apply relative z-10;
  }
  
  .suggestion-text {
    @apply block;
  }
  
  .suggestion-glow {
    @apply absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 opacity-0 transition-opacity duration-300;
    border-radius: 12px;
    filter: blur(8px);
    z-index: -1;
  }
  
  .suggestion-chip:hover .suggestion-glow {
    @apply opacity-20;
  }
  
  .suggestions-title {
    @apply animate-fade-in;
    animation-delay: 0.2s;
  }
  
  .suggestion-chip:nth-child(odd) {
    animation-delay: 0.1s;
  }
</style>