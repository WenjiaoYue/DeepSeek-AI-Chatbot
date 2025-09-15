<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { chatStore } from '$lib/stores/chat';
  
  onMount(() => {
    // 从本地存储加载聊天记录
    chatStore.loadFromStorage();
  });
</script>

<main class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <slot />
</main>