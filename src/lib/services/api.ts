import { apiConfigStore } from '../stores/api-config';
import { get } from 'svelte/store';
import type { Message } from '../stores/chat';
import type { APIConfig } from '../stores/api-config';

export class APIService {
  private static getActiveConfig(): APIConfig | null {
    const state = get(apiConfigStore);
    return state.configs.find(c => c.id === state.selectedConfigId) || null;
  }

  private static async makeRequest(messages: Message[], signal?: AbortSignal) {
    const config = this.getActiveConfig();
    if (!config) {
      throw new Error('没有选择API配置');
    }

    const state = get(apiConfigStore);
    if (!state.selectedModel) {
      throw new Error('没有选择模型');
    }

    const requestData = {
      model: state.selectedModel,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      stream: true,
      max_tokens: 2000,
      temperature: 0.7
    };

    const response = await fetch(`${config.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    return response;
  }

  static async* streamChat(messages: Message[], signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const response = await this.makeRequest(messages, signal);
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder('utf-8');
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices?.[0]?.delta?.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              console.error('解析SSE数据失败:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  static async generateSuggestions(lastResponse: string): Promise<string[]> {
    try {
      const config = this.getActiveConfig();
      if (!config) {
        return ['能详细解释一下吗？', '有什么相关例子？', '还有其他建议吗？'];
      }

      const state = get(apiConfigStore);
      if (!state.selectedModel) {
        return ['能详细解释一下吗？', '有什么相关例子？', '还有其他建议吗？'];
      }

      const messages: Message[] = [
        {
          role: 'user',
          content: `根据上一轮对话内容生成3个用户可能想问的后续问题。每个问题应该简短（不超过15个字），直接，不要带序号，不要带引号。以JSON数组格式返回，例如：["问题1", "问题2", "问题3"]。上一轮对话内容：${lastResponse}`,
          timestamp: Date.now()
        }
      ];

      const requestData = {
        model: state.selectedModel,
        messages: [
          { role: 'system', content: '你是一个聊天助手。根据上一轮对话，生成3个用户可能想问的后续问题。每个问题应该简短（不超过15个字），直接，不要带序号，不要带引号。以JSON数组格式返回，例如：["问题1", "问题2", "问题3"]' },
          { role: 'user', content: `上一轮对话内容：${lastResponse}` }
        ],
        max_tokens: 200,
        temperature: 0.7
      };

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      let suggestions: string[];
      try {
        suggestions = JSON.parse(content);
      } catch (e) {
        // 如果直接解析失败，尝试从文本中提取JSON部分
        const match = content.match(/\[.*\]/s);
        if (match) {
          suggestions = JSON.parse(match[0]);
        } else {
          // 如果仍然失败，使用简单的分割方法
          suggestions = content
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim())
            .slice(0, 3);
        }
      }

      return suggestions.map(s => s.length > 256 ? s.substring(0, 256) : s);
    } catch (error) {
      console.error('生成建议错误:', error);
      return ['能详细解释一下吗？', '有什么相关例子？', '还有其他建议吗？'];
    }
  }

  static async fetchModels(baseURL: string, apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('获取模型列表错误:', error);
      throw error;
    }
  }
}