<script lang="ts">
  import { models, selectedModel, settingsOpen, darkMode } from '../stores';
  import { generateId } from '../utils';
  import { X, Plus, Trash2, Settings as SettingsIcon, Moon, Sun } from 'lucide-svelte';
  import type { Model } from '../stores';

  let newModel: Partial<Model> = {
    name: '',
    apiUrl: '',
    apiKey: '',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    stream: true,
    reasoning: false
  };

  function closeSettings() {
    settingsOpen.set(false);
  }

  function addModel() {
    if (!newModel.name || !newModel.apiUrl || !newModel.apiKey) {
      alert('请填写完整的模型信息');
      return;
    }

    const model: Model = {
      id: generateId(),
      name: newModel.name,
      apiUrl: newModel.apiUrl,
      apiKey: newModel.apiKey,
      maxTokens: newModel.maxTokens || 2048,
      temperature: newModel.temperature || 0.7,
      topP: newModel.topP || 0.9,
      stream: newModel.stream ?? true,
      reasoning: newModel.reasoning ?? false
    };

    models.update(current => [...current, model]);
    
    // Reset form
    newModel = {
      name: '',
      apiUrl: '',
      apiKey: '',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      stream: true,
      reasoning: false
    };
  }

  function deleteModel(id: string) {
    if (confirm('确定要删除这个模型配置吗？')) {
      models.update(current => current.filter(m => m.id !== id));
      
      // If the deleted model was selected, switch to the first available model
      if ($selectedModel === id && $models.length > 0) {
        selectedModel.set($models[0].id);
      }
    }
  }

  function updateModel(id: string, field: keyof Model, value: any) {
    models.update(current => 
      current.map(model => 
        model.id === id ? { ...model, [field]: value } : model
      )
    );
  }

  function toggleDarkMode() {
    darkMode.update(current => !current);
  }
</script>

<!-- Overlay -->
{#if $settingsOpen}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
    on:click={closeSettings}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Escape' && closeSettings()}
  ></div>
{/if}

<!-- Settings Modal -->
{#if $settingsOpen}
  <div class="fixed inset-4 bg-gray-900 border border-gray-700 rounded-lg z-50 overflow-hidden md:inset-8 lg:inset-16">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-3">
        <SettingsIcon size="20" class="text-blue-500" />
        <h2 class="text-lg font-semibold text-white">设置</h2>
      </div>
      <button
        on:click={closeSettings}
        class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
      >
        <X size="20" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Theme Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white">外观设置</h3>
        <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div class="flex items-center gap-3">
            {#if $darkMode}
              <Moon size="18" class="text-blue-400" />
            {:else}
              <Sun size="18" class="text-yellow-400" />
            {/if}
            <span class="text-gray-200">深色模式</span>
          </div>
          <button
            on:click={toggleDarkMode}
            class="relative w-12 h-6 rounded-full transition-colors {$darkMode ? 'bg-blue-600' : 'bg-gray-600'}"
          >
            <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {$darkMode ? 'translate-x-6' : 'translate-x-0'}"></div>
          </button>
        </div>
      </div>

      <!-- Current Models -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white">已配置的模型</h3>
        
        {#if $models.length === 0}
          <div class="text-center py-8 text-gray-500">
            <p>暂无配置的模型</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each $models as model}
              <div class="bg-gray-800 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-white">{model.name}</h4>
                  <button
                    on:click={() => deleteModel(model.id)}
                    class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                    title="删除模型"
                  >
                    <Trash2 size="16" />
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">API URL</label>
                    <input
                      type="url"
                      value={model.apiUrl}
                      on:input={(e) => updateModel(model.id, 'apiUrl', e.currentTarget.value)}
                      class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://api.openai.com/v1/chat/completions"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                    <input
                      type="password"
                      value={model.apiKey}
                      on:input={(e) => updateModel(model.id, 'apiKey', e.currentTarget.value)}
                      class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk-..."
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">最大令牌数</label>
                    <input
                      type="number"
                      value={model.maxTokens}
                      on:input={(e) => updateModel(model.id, 'maxTokens', parseInt(e.currentTarget.value))}
                      class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="32000"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">温度 ({model.temperature})</label>
                    <input
                      type="range"
                      value={model.temperature}
                      on:input={(e) => updateModel(model.id, 'temperature', parseFloat(e.currentTarget.value))}
                      class="w-full"
                      min="0"
                      max="2"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Top P ({model.topP})</label>
                    <input
                      type="range"
                      value={model.topP}
                      on:input={(e) => updateModel(model.id, 'topP', parseFloat(e.currentTarget.value))}
                      class="w-full"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-300">流式输出</span>
                    <button
                      on:click={() => updateModel(model.id, 'stream', !model.stream)}
                      class="relative w-12 h-6 rounded-full transition-colors {model.stream ? 'bg-blue-600' : 'bg-gray-600'}"
                    >
                      <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {model.stream ? 'translate-x-6' : 'translate-x-0'}"></div>
                    </button>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-300">推理模式</span>
                    <button
                      on:click={() => updateModel(model.id, 'reasoning', !model.reasoning)}
                      class="relative w-12 h-6 rounded-full transition-colors {model.reasoning ? 'bg-blue-600' : 'bg-gray-600'}"
                    >
                      <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {model.reasoning ? 'translate-x-6' : 'translate-x-0'}"></div>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Add New Model -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white">添加新模型</h3>
        
        <div class="bg-gray-800 rounded-lg p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">模型名称</label>
              <input
                type="text"
                bind:value={newModel.name}
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GPT-4"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">API URL</label>
              <input
                type="url"
                bind:value={newModel.apiUrl}
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-300 mb-1">API Key</label>
              <input
                type="password"
                bind:value={newModel.apiKey}
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-300">流式输出</span>
              <button
                on:click={() => newModel.stream = !newModel.stream}
                class="relative w-12 h-6 rounded-full transition-colors {newModel.stream ? 'bg-blue-600' : 'bg-gray-600'}"
              >
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {newModel.stream ? 'translate-x-6' : 'translate-x-0'}"></div>
              </button>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-300">推理模式</span>
              <button
                on:click={() => newModel.reasoning = !newModel.reasoning}
                class="relative w-12 h-6 rounded-full transition-colors {newModel.reasoning ? 'bg-blue-600' : 'bg-gray-600'}"
              >
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {newModel.reasoning ? 'translate-x-6' : 'translate-x-0'}"></div>
              </button>
            </div>
          </div>

          <button
            on:click={addModel}
            class="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Plus size="18" />
            <span>添加模型</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
