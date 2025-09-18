import { writable } from 'svelte/store';

export interface ModelInfo {
  id: string;   // 真实模型标识（如路径或模型ID）
  name: string; // 展示名称
}

export interface APIConfig {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: ModelInfo[];   // ✅ 统一为对象数组
  isActive: boolean;
}

export interface APIConfigState {
  configs: APIConfig[];
  selectedConfigId: string | null;
  selectedModel: string | null; // 始终存放模型 id
}

// ---------- 工具方法：向后兼容 & 规范化 ----------
type ModelLike = string | ModelInfo;

function toModelInfo(m: ModelLike): ModelInfo {
  return typeof m === 'string' ? { id: m, name: m } : m;
}
function normalizeModels(arr: ModelLike[] | ModelInfo[]): ModelInfo[] {
  return (arr ?? []).map(toModelInfo);
}
function normalizeConfig(raw: any): APIConfig {
  const models = normalizeModels(raw?.models ?? []);
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    baseURL: String(raw?.baseURL ?? ''),
    apiKey: String(raw?.apiKey ?? ''),
    models,
    isActive: Boolean(raw?.isActive),
  };
}
function normalizeState(raw: any): APIConfigState {
  const configs = Array.isArray(raw?.configs) ? raw.configs.map(normalizeConfig) : [];
  const selectedConfigId = raw?.selectedConfigId ?? null;

  // selectedModel 需要是字符串 id；如果出现对象或无匹配，兜底取所选配置的第一个模型
  let selectedModel: string | null = null;
  const sm = raw?.selectedModel;
  if (typeof sm === 'string') selectedModel = sm;
  else if (sm && typeof sm === 'object' && typeof sm.id === 'string') selectedModel = sm.id;

  if (!selectedModel && selectedConfigId) {
    const cfg = configs.find(c => c.id === selectedConfigId);
    selectedModel = cfg?.models?.[0]?.id ?? null;
  }

  return { configs, selectedConfigId, selectedModel };
}

// ---------- 初始状态（已用对象数组） ----------
const initialState: APIConfigState = {
  configs: [
    {
      id: 'default',
      name: 'DeepSeek R1 满血1P2D分离版',
      baseURL: 'http://220.203.247.201:8031',
      apiKey: 'empty',
      models: [
        { id: '/mnt/disk2/hf_models/DeepSeek-R1-G2-static/', name: 'DeepSeek R1 满血1P2D分离版' },
      ],
      isActive: true,
    },
    {
      id: 'second',
      name: 'DeepSeek v3.1 满血Gaudi单机版',
      baseURL: 'http://220.203.247.201:8043',
      apiKey: '123456',
      models: [{ id: '/models/DeepSeek-V3.1-G2', name: 'DeepSeek v3.1 满血Gaudi单机版' }],
      isActive: false,
    },
  ],
  selectedConfigId: 'default',
  selectedModel: '/mnt/disk2/hf_models/DeepSeek-R1-G2-static/',
};

// 允许 add/update 传入 string 或对象，内部统一规范化
type AddableConfig = Omit<APIConfig, 'id' | 'models'> & { models: ModelLike[] };

function createAPIConfigStore() {
  const { subscribe, set, update } = writable<APIConfigState>(initialState);

  return {
    subscribe,

    addConfig: (config: AddableConfig) => {
      update((state) => {
        const newConfig: APIConfig = {
          ...config,
          id: Date.now().toString(),
          models: normalizeModels(config.models),
        };
        return {
          ...state,
          configs: [...state.configs, newConfig],
        };
      });
    },

    updateConfig: (id: string, updates: Partial<Omit<APIConfig, 'models'>> & { models?: ModelLike[] }) => {
      update((state) => ({
        ...state,
        configs: state.configs.map((config) =>
          config.id === id
            ? {
                ...config,
                ...updates,
                ...(updates.models ? { models: normalizeModels(updates.models) } : null),
              }
            : config
        ),
      }));
    },

    deleteConfig: (id: string) => {
      update((state) => {
        const nextConfigs = state.configs.filter((c) => c.id !== id);
        const removingCurrent = state.selectedConfigId === id;
        let nextSelectedConfigId = removingCurrent ? null : state.selectedConfigId;
        let nextSelectedModel = state.selectedModel;

        if (removingCurrent) {
          // 若删除的是当前配置，清空选中项
          nextSelectedModel = null;
        }

        return {
          ...state,
          configs: nextConfigs,
          selectedConfigId: nextSelectedConfigId,
          selectedModel: nextSelectedModel,
        };
      });
    },

    selectConfig: (configId: string) => {
      update((state) => {
        const cfg = state.configs.find((c) => c.id === configId);
        return {
          ...state,
          selectedConfigId: configId,
          selectedModel: cfg?.models?.[0]?.id ?? null, // ✅ 取该配置的首个模型 id
        };
      });
    },

    selectModel: (modelId: string) => {
      update((state) => ({
        ...state,
        selectedModel: modelId, // ✅ 始终存 id
      }));
    },

    loadFromStorage: () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('api-configs');
          if (stored) {
            const raw = JSON.parse(stored);
            const normalized = normalizeState(raw);
            set(normalized);
          }
        } catch (error) {
          console.error('Failed to load API configs from storage:', error);
        }
      }
    },

    saveToStorage: (state: APIConfigState) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('api-configs', JSON.stringify(state));
      }
    },
  };
}

export const apiConfigStore = createAPIConfigStore();

// 自动保存到本地存储
apiConfigStore.subscribe((state) => {
  apiConfigStore.saveToStorage(state);
});
