import { writable } from 'svelte/store';
import { browser } from './utils';

export interface Model {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  reasoning?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  timestamp: Date;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// Default models
const defaultModels: Model[] = [
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    stream: true,
    reasoning: false,
  },
  {
    id: 'openai-o1',
    name: 'OpenAI o1-preview',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    maxTokens: 2048,
    temperature: 1.0,
    stream: true,
    reasoning: true,
  }
];

// Load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!browser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (!browser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Stores
export const models = writable<Model[]>(loadFromStorage('chatbot_models', defaultModels));
export const selectedModel = writable<string>(loadFromStorage('chatbot_selected_model', 'openai-gpt4'));
export const conversations = writable<Conversation[]>(loadFromStorage('chatbot_conversations', []));
export const currentConversation = writable<string | null>(loadFromStorage('chatbot_current_conversation', null));
export const sidebarOpen = writable<boolean>(false);
export const settingsOpen = writable<boolean>(false);
export const darkMode = writable<boolean>(loadFromStorage('chatbot_dark_mode', true));
export const isLoading = writable<boolean>(false);

// Subscribe to changes and save to localStorage
models.subscribe(value => saveToStorage('chatbot_models', value));
selectedModel.subscribe(value => saveToStorage('chatbot_selected_model', value));
conversations.subscribe(value => saveToStorage('chatbot_conversations', value));
currentConversation.subscribe(value => saveToStorage('chatbot_current_conversation', value));
darkMode.subscribe(value => saveToStorage('chatbot_dark_mode', value));

// Prompt suggestions
export const promptSuggestions = [
  "解释一个复杂的概念",
  "帮我写一段代码",
  "总结这篇文章的要点",
  "翻译这段文字",
  "帮我解决这个问题",
  "写一个创意故事",
  "分析这个数据",
  "优化这段代码"
];