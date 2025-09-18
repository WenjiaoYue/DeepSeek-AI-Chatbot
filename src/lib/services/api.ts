import { apiConfigStore } from "../stores/api-config";
import { get } from "svelte/store";
import type { Message } from "../stores/chat";
import type { APIConfig } from "../stores/api-config";

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
      [k: string]: any;
    };
    finish_reason?: string | null;
    index?: number;
    [k: string]: any;
  }>;
  [k: string]: any;
};

export class APIService {
  private static getActiveConfig(): APIConfig | null {
    const state = get(apiConfigStore);
    return state.configs.find((c) => c.id === state.selectedConfigId) || null;
  }

private static async makeRequest(messages: Message[], signal?: AbortSignal) {
  const config = this.getActiveConfig();
  if (!config) {
    throw new Error("没有选择API配置");
  }

  const state = get(apiConfigStore);
  if (!state.selectedModel) {
    throw new Error("没有选择模型");
  }

  const requestData = {
    model: state.selectedModel,
    messages: messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    stream: true,
    max_tokens: 2000,
    temperature: 0.7,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  // 根据 baseURL 判断请求路径
  let endpoint = "/v1/chat/completions";
  if (config.baseURL === "http://220.203.247.201:8031") {
    endpoint = "/v1/chat/completions_PD";
  } else if (config.baseURL === "http://220.203.247.201:8043") {
    endpoint = "/v1/chat/completions";
  }

  const response = await fetch(`${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestData),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  return response;
}


  // ✅ 现在返回 JSON 事件（包含 content 和 reasoning_content）
  static async *streamChat(
    messages: Message[],
    signal?: AbortSignal,
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await this.makeRequest(messages, signal);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法获取响应流");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const findEventSep = (buf: string) => {
      const iLF = buf.indexOf("\n\n");
      const iCRLF = buf.indexOf("\r\n\r\n");
      if (iLF === -1) return iCRLF;
      if (iCRLF === -1) return iLF;
      return Math.min(iLF, iCRLF);
    };
    const sepLenAt = (buf: string, idx: number) =>
      buf.startsWith("\r\n\r\n", idx) ? 4 : 2;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode(); // flush
          // 处理尾包里剩余的完整事件
          while (true) {
            const sep = findEventSep(buffer);
            if (sep === -1) break;
            const eventChunk = buffer.slice(0, sep);
            buffer = buffer.slice(sep + sepLenAt(buffer, sep));
            const payload = parseSSEEventData(eventChunk);
            if (payload === null) continue;
            if (payload === "[DONE]") return;
            yield payload as StreamChunk;
          }
          // 剩余不完整内容尝试兜底解析一次
          const tailPayload = parseSSEEventData(buffer);
          if (tailPayload && tailPayload !== "[DONE]") {
            yield tailPayload as StreamChunk;
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 循环清空“完整事件”
        while (true) {
          const sep = findEventSep(buffer);
          if (sep === -1) break;

          const eventChunk = buffer.slice(0, sep);
          buffer = buffer.slice(sep + sepLenAt(buffer, sep));

          const payload = parseSSEEventData(eventChunk);
          if (payload === null) continue;
          if (payload === "[DONE]") return;
          yield payload as StreamChunk;
        }
      }
    } finally {
      reader.releaseLock();
    }

    // —— 工具：合并一个 SSE 事件内的所有 data: 行并解析 —— //
    function parseSSEEventData(eventChunk: string): object | string | null {
      // 合并多行 data:（按 SSE 规范以换行连接）
      const lines = eventChunk.split(/\r?\n/);
      let dataPayload = "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          // 支持 'data:xxx' 与 'data: xxx'
          dataPayload += line.slice(5).replace(/^\s/, "") + "\n";
        }
      }
      dataPayload = dataPayload.trimEnd();
      if (!dataPayload) return null;
      if (dataPayload === "[DONE]") return "[DONE]";
      try {
        return JSON.parse(dataPayload);
      } catch (e) {
        console.error("解析SSE事件失败:", e, "事件内容:", eventChunk);
        return null;
      }
    }
  }

  // 旧的 drain 方法已合并到新逻辑；这里不再需要 #drainSSEBuffer

  static async generateSuggestions(lastResponse: string): Promise<string[]> {
    try {
      const config = this.getActiveConfig();
      if (!config) {
        return ["能详细解释一下吗？", "有什么相关例子？", "还有其他建议吗？"];
      }

      const state = get(apiConfigStore);
      if (!state.selectedModel) {
        return ["能详细解释一下吗？", "有什么相关例子？", "还有其他建议吗？"];
      }

      const requestData = {
        model: state.selectedModel,
        messages: [
          {
            role: "system",
            content:
              '你是一个聊天助手。根据上一轮对话，生成3个用户可能想问的后续问题。每个问题应该简短（不超过15个字），直接，不要带序号，不要带引号。以JSON数组格式返回，例如：["问题1", "问题2", "问题3"]',
          },
          { role: "user", content: `上一轮对话内容：${lastResponse}` },
        ],
        max_tokens: 200,
        temperature: 0.7,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

      const response = await fetch(`${config.baseURL}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? "";

      let suggestions: string[] = [];
      try {
        if (content) suggestions = JSON.parse(content);
      } catch {
        const match = content.match(/\[.*\]/s);
        if (match) {
          try { suggestions = JSON.parse(match[0]); } catch {}
        }
        if (suggestions.length === 0) {
          suggestions = content
            .split("\n")
            .map((x: string) =>
              x
                .replace(/^\s*[-*]\s*/, "")
                .replace(/^\d+\.\s*/, "")
                .replace(/^["']|["']$/g, "")
                .trim(),
            )
            .filter(Boolean)
            .slice(0, 3);
        }
      }

      return suggestions
        .filter((s) => typeof s === "string")
        .map((s) => (s.length > 256 ? s.slice(0, 256) : s));
    } catch (error) {
      console.error("生成建议错误:", error);
      return ["能详细解释一下吗？", "有什么相关例子？", "还有其他建议吗？"];
    }
  }

  static async fetchModels(baseURL: string, apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error("获取模型列表错误:", error);
      throw error;
    }
  }
}
