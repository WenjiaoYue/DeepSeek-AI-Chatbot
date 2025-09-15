import { writable } from 'svelte/store';

export interface APIConfig {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: string[];
  isActive: boolean;
}

export interface APIConfigState {
  configs: APIConfig[];
  selectedConfigId: string | null;
  selectedModel: string | null;
}

const initialState: APIConfigState = {
  configs: [
    {
      id: 'default',
      name: 'DeepSeek',
      baseURL: 'http://220.203.247.201:8043',
      apiKey: '123456',
      models: ['/models/DeepSeek-V3.1-G2'],
      isActive: true
    }
  ],
  selectedConfigId: 'default',
  selectedModel: '/models/DeepSeek-V3.1-G2'
};

function createAPIConfigStore() {
  const { subscribe, set, update } = writable<APIConfigState>(initialState);

  return {
    subscribe,
    
    addConfig: (config: Omit<APIConfig, 'id'>) => {
      update(state => {
        const newConfig: APIConfig = {
          ...config,
          id: Date.now().toString()
        };
        return {
          ...state,
          configs: [...state.configs, newConfig]
        };
      });
    },
    
    updateConfig: (id: string, updates: Partial<APIConfig>) => {
      update(state => ({
        ...state,
        configs: state.configs.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      }));
    },
    
    deleteConfig: (id: string) => {
      update(state => ({
        ...state,
        configs: state.configs.filter(config => config.id !== id),
        selectedConfigId: state.selectedConfigId === id ? null : state.selectedConfigId
      }));
    },
    
    selectConfig: (configId: string) => {
      update(state => {
        const config = state.configs.find(c => c.id === configId);
        return {
          ...state,
          selectedConfigId: configId,
          selectedModel: config?.models[0] || null
        };
      });
    },
    
    selectModel: (model: string) => {
      update(state => ({
        ...state,
        selectedModel: model
      }));
    },
    
    loadFromStorage: () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('api-configs');
          if (stored) {
            const data = JSON.parse(stored);
            set(data);
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
    }
  };
}

export const apiConfigStore = createAPIConfigStore();

// 自动保存到本地存储
apiConfigStore.subscribe(state => {
  apiConfigStore.saveToStorage(state);
});