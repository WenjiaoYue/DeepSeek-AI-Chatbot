import { writable } from 'svelte/store';
import type { Message } from './chat';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatHistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

const initialState: ChatHistoryState = {
  sessions: [],
  currentSessionId: null
};

function createChatHistoryStore() {
  const { subscribe, set, update } = writable<ChatHistoryState>(initialState);

  return {
    subscribe,
    
    createSession: (title: string = '新对话') => {
      const sessionId = Date.now().toString();
      update(state => ({
        ...state,
        sessions: [{
          id: sessionId,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, ...state.sessions],
        currentSessionId: sessionId
      }));
      return sessionId;
    },
    
    updateSession: (sessionId: string, messages: Message[]) => {
      update(state => ({
        ...state,
        sessions: state.sessions.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages, 
                updatedAt: Date.now(),
                title: session.title === '新对话' && messages.length > 0 
                  ? messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '')
                  : session.title
              }
            : session
        )
      }));
    },
    
    deleteSession: (sessionId: string) => {
      update(state => ({
        ...state,
        sessions: state.sessions.filter(session => session.id !== sessionId),
        currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId
      }));
    },
    
    selectSession: (sessionId: string) => {
      update(state => ({
        ...state,
        currentSessionId: sessionId
      }));
    },
    
    loadFromStorage: () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('chat-history');
          if (stored) {
            const data = JSON.parse(stored);
            set(data);
          }
        } catch (error) {
          console.error('Failed to load chat history from storage:', error);
        }
      }
    },
    
    saveToStorage: (state: ChatHistoryState) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat-history', JSON.stringify(state));
      }
    }
  };
}

export const chatHistoryStore = createChatHistoryStore();

// 自动保存到本地存储
chatHistoryStore.subscribe(state => {
  chatHistoryStore.saveToStorage(state);
});