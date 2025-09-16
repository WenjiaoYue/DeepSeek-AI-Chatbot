<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { apiConfigStore } from "../stores/api-config";
    import { APIService } from "../services/api";
    import { X, Plus, Trash2, RefreshCw, Edit } from "lucide-svelte";
    import type { APIConfig } from "../stores/api-config";

    const dispatch = createEventDispatcher<{
        close: void;
    }>();

    export let isOpen = false;

    let newConfig = {
        name: "",
        baseURL: "",
        apiKey: "",
        models: [] as string[],
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
            const models = await APIService.fetchModels(
                newConfig.baseURL,
                newConfig.apiKey,
            );
            newConfig.models = models;
        } catch (error) {
            alert("获取模型列表失败: ");
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
            // 更新现有配置
            apiConfigStore.updateConfig(editingConfigId, newConfig);
            editingConfigId = null;
        } else {
            // 添加新配置
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
            models: [...config.models],
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
    <div class="modal-overlay" on:click={handleClose}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2 class="modal-title">API 配置管理</h2>
                <button class="close-btn" on:click={handleClose}>
                    <X size={20} />
                </button>
            </div>

            <div class="modal-body">
                <!-- 现有配置列表 -->
                <div class="config-list">
                    <div class="section-header">
                        <h3>已配置的API</h3>
                        <button
                            class="add-btn"
                            on:click={() => (showAddForm = !showAddForm)}
                        >
                            <Plus size={16} />
                            添加配置
                        </button>
                    </div>

                    {#each $apiConfigStore.configs as config (config.id)}
                        <div
                            class="config-item {$apiConfigStore.selectedConfigId ===
                            config.id
                                ? 'active'
                                : ''}"
                        >
                            <div
                                class="config-info"
                                on:click={() => handleSelectConfig(config.id)}
                            >
                                <div class="config-name">{config.name}</div>
                                <div class="config-url">{config.baseURL}</div>
                                <div class="config-models">
                                    模型数量: {config.models.length}
                                </div>
                            </div>
                            <div class="config-actions">
                                <button
                                    class="edit-config-btn"
                                    on:click={() => handleEditConfig(config)}
                                    title="编辑配置"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    class="delete-config-btn"
                                    on:click={() =>
                                        handleDeleteConfig(config.id)}
                                    title="删除配置"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>

                <!-- 添加新配置表单 -->
                {#if showAddForm}
                    <div class="add-form">
                        <h3>
                            {editingConfigId
                                ? "编辑API配置"
                                : "添加新的API配置"}
                        </h3>

                        <div class="form-group">
                            <label>配置名称</label>
                            <input
                                type="text"
                                bind:value={newConfig.name}
                                placeholder="例如: OpenAI GPT-4"
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label>API地址</label>
                            <input
                                type="text"
                                bind:value={newConfig.baseURL}
                                placeholder="例如: http://10.165.58.224:30080/v1"
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label>API密钥</label>
                            <input
                                type="password"
                                bind:value={newConfig.apiKey}
                                placeholder="输入API密钥"
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label>可用模型</label>
                            <div class="models-section">
                                <button
                                    class="load-models-btn"
                                    on:click={handleLoadModels}
                                    disabled={isLoadingModels}
                                >
                                    {#if isLoadingModels}
                                        <RefreshCw
                                            size={16}
                                            class="animate-spin"
                                        />
                                        获取中...
                                    {:else}
                                        <RefreshCw size={16} />
                                        获取模型列表
                                    {/if}
                                </button>

                                {#if newConfig.models.length > 0}
                                    <div class="models-list">
                                        {#each newConfig.models as model}
                                            <div class="model-item">
                                                {model}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="form-actions">
                            <button
                                class="cancel-btn"
                                on:click={editingConfigId
                                    ? handleCancelEdit
                                    : () => (showAddForm = false)}
                            >
                                取消
                            </button>
                            <button class="save-btn" on:click={handleAddConfig}>
                                {editingConfigId ? "更新配置" : "保存配置"}
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
    }

    .modal-content {
        @apply bg-white max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto;
    }

    .modal-header {
        @apply flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100;
    }

    .modal-title {
        @apply text-xl font-semibold text-blue-900;
    }

    .close-btn {
        @apply p-2 text-blue-400 hover:text-blue-600 transition-colors;
    }

    .modal-body {
        @apply p-6 space-y-6;
    }

    .section-header {
        @apply flex items-center justify-between mb-4;
    }

    .section-header h3 {
        @apply text-lg font-medium text-gray-900;
    }

    .add-btn {
        @apply flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors;
    }

    .config-list {
        @apply space-y-3;
    }

    .config-item {
        @apply flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors;
    }

    .config-item.active {
        @apply border-blue-600 bg-blue-50;
    }

    .config-info {
        @apply flex-1;
    }

    .config-name {
        @apply font-medium text-gray-900;
    }

    .config-url {
        @apply text-sm text-gray-600 mt-1;
    }

    .config-models {
        @apply text-xs text-gray-500 mt-1;
    }

    .config-actions {
        @apply flex items-center space-x-2;
    }

    .edit-config-btn {
        @apply p-2 text-gray-400 hover:text-blue-600 transition-colors;
    }

    .delete-config-btn {
        @apply p-2 text-gray-400 hover:text-red-600 transition-colors;
    }

    .add-form {
        @apply border-t border-gray-200 pt-6 space-y-4;
    }

    .add-form h3 {
        @apply text-lg font-medium text-gray-900;
    }

    .form-group {
        @apply space-y-2;
    }

    .form-group label {
        @apply block text-sm font-medium text-gray-700;
    }

    .form-input {
        @apply w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
    }

    .models-section {
        @apply space-y-3;
    }

    .load-models-btn {
        @apply flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50;
    }

    .models-list {
        @apply space-y-1 max-h-32 overflow-y-auto;
    }

    .model-item {
        @apply px-3 py-2 bg-gray-50 text-sm text-gray-700 border border-gray-200;
    }

    .form-actions {
        @apply flex justify-end space-x-3 pt-4;
    }

    .cancel-btn {
        @apply px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors;
    }

    .save-btn {
        @apply px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors;
    }
</style>
