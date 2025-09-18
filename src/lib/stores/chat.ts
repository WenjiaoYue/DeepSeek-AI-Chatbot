import { writable } from 'svelte/store';

export type Role = 'user' | 'assistant' | 'system';

export type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp?: number; // 可选，如果你想在 UI 里显示时间就保留
  // ✅ 新增：用于承载 reasoning_content 等扩展信息
  meta?: {
    reasoningContent?: string;
    [k: string]: any;
  };
};

type ChatState = {
  messages: Message[];
  generating: boolean;      // 真正的状态字段
  isGenerating: boolean;    // 为了兼容你组件里已有用法，同步维护
  controller: AbortController | null;
};

function uid() {
  return (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
}

const base = writable<ChatState>({
  messages: [],
  generating: false,
  isGenerating: false,
  controller: null
});

export const chatStore = {
  subscribe: base.subscribe,
  set: base.set,
  update: base.update, // ✅ 暴露 update，解决 TS 报错

  reset() {
    base.set({
      messages: [],
      generating: false,
      isGenerating: false,
      controller: null
    });
  },

  clearMessages() {
    base.update(s => ({ ...s, messages: [] }));
  },

  loadSession(messages: Message[]) {
    base.update(s => ({ ...s, messages: messages ?? [] }));
  },

  setGenerating(v: boolean) {
    base.update(s => ({ ...s, generating: v, isGenerating: v })); // ✅ 两字段保持一致
  },

  setController(c: AbortController | null) {
    base.update(s => ({ ...s, controller: c }));
  },

  addMessage(role: Role, content: string) {
    base.update(s => ({
      ...s,
      messages: [
        ...s.messages,
        { id: uid(), role, content, timestamp: Date.now() }
      ]
    }));
  },

  /** 幂等：最后一条是 assistant 则覆盖其 content，否则新建一条 assistant */
  patchLastAssistantContent(content: string) {
    base.update(s => {
      const msgs = s.messages.slice();
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      } else {
        msgs.push({
          id: uid(),
          role: 'assistant',
          content,
          timestamp: Date.now()
        });
      }
      return { ...s, messages: msgs };
    });
  },

  /** ✅ 新增：仅 patch 最后一条助手消息的 meta（如 { reasoningContent } ） */
  patchLastAssistantMeta(meta: Record<string, any>) {
    base.update(s => {
      const msgs = s.messages.slice();
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          const prevMeta = msgs[i].meta ?? {};
          msgs[i] = { ...msgs[i], meta: { ...prevMeta, ...meta } };
          break;
        }
      }
      return { ...s, messages: msgs };
    });
  },

  /** 可选：一次同时 patch content 与 meta（传入哪个 patch 哪个） */
  patchLastAssistantContentAndMeta(content?: string, meta?: Record<string, any>) {
    base.update(s => {
      const msgs = s.messages.slice();
      // 找到最后一条助手消息
      let targetIdx = -1;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') { targetIdx = i; break; }
      }

      if (targetIdx === -1) {
        // 如果不存在助手消息，则新建一条（当有内容时）
        msgs.push({
          id: uid(),
          role: 'assistant',
          content: content ?? '',
          timestamp: Date.now(),
          meta: meta ? { ...meta } : undefined
        });
      } else {
        const m = { ...msgs[targetIdx] };
        if (typeof content === 'string') m.content = content;
        if (meta) m.meta = { ...(m.meta ?? {}), ...meta };
        msgs[targetIdx] = m;
      }

      return { ...s, messages: msgs };
    });
  }
};
