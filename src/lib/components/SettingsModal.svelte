<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { apiConfigStore } from "../stores/api-config";
  import { APIService } from "../services/api";
  import { X, Plus, Trash2, RefreshCw, Edit } from "lucide-svelte";
  import type { APIConfig, APIModel } from "../stores/api-config";

  const dispatch = createEventDispatcher<{ close: void }>();
  export let isOpen = false;

  type NewConfig = {
    name: string;
    baseURL: string;
    apiKey: string;
    models: APIModel[]; // ✅ 统一对象数组
    isActive: boolean;
  };

  let newConfig: NewConfig = {
    name: "",
    baseURL: "",
    apiKey: "",
    models: [],
    isActive: false,
  };

  let isLoadingModels = false;
  let showAddForm = false;
  let editingConfigId: string | null = null;

  function handleClose() {
    dispatch("close");
    showAddForm = false;
    editingConfigId = null;
    resetNewConfig();
  }

  function resetNewConfig() {
    newConfig = {
      name: "",
      baseURL: "",
      apiKey: "",
      models: [],
      isActive: false,
    };
  }

  async function handleLoadModels() {
    if (!newConfig.baseURL || !newConfig.apiKey) {
      alert("请先填写API地址和密钥");
      return;
    }

    isLoadingModels = true;
    try {
      // ✅ 兼容你的两套网关：直接给固定模型
      if (newConfig.baseURL === "http://220.203.247.201:8031") {
        newConfig.models = [
          {
            id: "/mnt/disk2/hf_models/DeepSeek-R1-G2-static/",
            name: "DeepSeek R1 满血1P2D分离版",
          },
        ];
      } else if (newConfig.baseURL === "http://220.203.247.201:8043") {
        newConfig.models = [
          { id: "/models/DeepSeek-V3.1-G2", name: "DeepSeek v3.1 满血Gaudi单机版" },
        ];
      } else {
        // 其它网关：动态获取
        const ids = await APIService.fetchModels(newConfig.baseURL, newConfig.apiKey);
        newConfig.models = (ids ?? []).map((id) => ({ id, name: id }));
      }
    } catch (error) {
      console.error(error);
      alert("获取模型列表失败");
    } finally {
      isLoadingModels = false;
    }
  }

  function handleAddConfig() {
    if (
      !newConfig.name ||
      !newConfig.baseURL ||
      !newConfig.apiKey ||
      newConfig.models.length === 0
    ) {
      alert("请填写完整信息并获取模型列表");
      return;
    }

    if (editingConfigId) {
      apiConfigStore.updateConfig(editingConfigId, newConfig);
      editingConfigId = null;
    } else {
      apiConfigStore.addConfig(newConfig);
    }

    resetNewConfig();
    showAddForm = false;
  }

  function handleDeleteConfig(id: string) {
    if (confirm("确定要删除这个API配置吗？")) {
      apiConfigStore.deleteConfig(id);
    }
  }

  function handleSelectConfig(configId: string) {
    apiConfigStore.selectConfig(configId);
  }

  function handleEditConfig(config: APIConfig) {
    editingConfigId = config.id;
    newConfig = {
      name: config.name,
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      models: [...config.models], // ✅ 保持对象数组
      isActive: config.isActive,
    };
    showAddForm = true;
  }

  function handleCancelEdit() {
    editingConfigId = null;
    showAddForm = false;
    resetNewConfig();
  }
</script>

{#if isOpen}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    on:click={handleClose}
    aria-modal="true"
    role="dialog"
    aria-labelledby="api-config-title"
  >
    <!-- Modal -->
    <div
      class="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <h2 id="api-config-title" class="text-xl font-semibold text-blue-900">
          API 配置管理
        </h2>
        <button
          class="inline-flex items-center rounded-lg p-2 text-blue-500 hover:text-blue-700 transition"
          on:click={handleClose}
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- 现有配置列表 -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">已配置的 API</h3>
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              on:click={() => (showAddForm = !showAddForm)}
            >
              <Plus size={16} />
              {showAddForm ? "收起" : "添加配置"}
            </button>
          </div>

          <div class="space-y-3">
            {#each $apiConfigStore.configs as config (config.id)}
              <div
                class="flex items-center justify-between rounded-xl border p-4 transition cursor-pointer hover:bg-gray-50
                       { $apiConfigStore.selectedConfigId === config.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200' }"
              >
                <button
                  class="flex-1 text-left"
                  on:click={() => handleSelectConfig(config.id)}
                  aria-label={`选择配置 ${config.name}`}
                >
                  <div class="font-medium text-gray-900">{config.name}</div>
                  <div class="mt-1 text-sm text-gray-600">{config.baseURL}</div>
                  <div class="mt-1 text-xs text-gray-500">
                    模型数量：{config.models.length}
                  </div>
                </button>

                <div class="ml-4 flex items-center gap-2">
                  <button
                    class="inline-flex items-center rounded-lg p-2 text-gray-500 hover:text-blue-600 transition"
                    title="编辑配置"
                    on:click={() => handleEditConfig(config)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    class="inline-flex items-center rounded-lg p-2 text-gray-500 hover:text-red-600 transition"
                    title="删除配置"
                    on:click={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 添加 / 编辑配置表单 -->
        {#if showAddForm}
          <section class="border-t border-gray-200 pt-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">
              {editingConfigId ? "编辑 API 配置" : "添加新的 API 配置"}
            </h3>

            <div class="space-y-4">
              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="mb-1 block text-sm font-medium text-gray-700">配置名称</label>
                <input
                  type="text"
                  bind:value={newConfig.name}
                  placeholder="例如：OpenAI GPT-4"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="mb-1 block text-sm font-medium text-gray-700">API 地址</label>
                <input
                  type="text"
                  bind:value={newConfig.baseURL}
                  placeholder="例如：http://10.165.58.224:30080/v1"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">API 密钥</label>
                <input
                  type="password"
                  bind:value={newConfig.apiKey}
                  placeholder="输入 API 密钥"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">可用模型</label>
                <div class="space-y-3">
                  <button
                    class="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                    on:click={handleLoadModels}
                    disabled={isLoadingModels}
                    type="button"
                  >
                    {#if isLoadingModels}
                      <RefreshCw size={16} class="animate-spin" />
                      获取中…
                    {:else}
                      <RefreshCw size={16} />
                      获取模型列表
                    {/if}
                  </button>

                  {#if newConfig.models.length > 0}
                    <div class="max-h-32 overflow-y-auto">
                      <ul class="flex flex-wrap gap-2">
                        {#each newConfig.models as model}
                          <li
                            class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                            title={model.id}
                          >
                            {model.name ?? model.id}
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition"
                  on:click={editingConfigId ? handleCancelEdit : () => (showAddForm = false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition"
                  on:click={handleAddConfig}
                >
                  {editingConfigId ? "更新配置" : "保存配置"}
                </button>
              </div>
            </div>
          </section>
        {/if}
      </div>
    </div>
  </div>
{/if}
