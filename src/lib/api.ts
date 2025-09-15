import type { Model, Message } from './stores';

export interface ChatRequest {
  model: Model;
  messages: Message[];
  onChunk?: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export async function sendChatMessage(request: ChatRequest): Promise<string> {
  const { model, messages, onChunk, onReasoning, onComplete, onError } = request;
  
  if (!model.apiKey) {
    const error = '请先配置API Key';
    onError?.(error);
    throw new Error(error);
  }

  const payload = {
    model: model.id.includes('gpt') ? 'gpt-4' : model.id,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    max_tokens: model.maxTokens || 2048,
    temperature: model.temperature || 0.7,
    top_p: model.topP || 0.9,
    stream: model.stream || false
  };

  try {
    const response = await fetch(model.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    if (model.stream && response.body) {
      return await handleStreamResponse(response, { onChunk, onReasoning, onComplete, onError });
    } else {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '未收到有效响应';
      onComplete?.();
      return content;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '网络请求失败';
    onError?.(errorMessage);
    throw error;
  }
}

async function handleStreamResponse(
  response: Response, 
  handlers: {
    onChunk?: (chunk: string) => void;
    onReasoning?: (reasoning: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
  }
): Promise<string> {
  const { onChunk, onReasoning, onComplete, onError } = handlers;
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let reasoning = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim();
          
          if (data === '[DONE]') {
            onComplete?.();
            return fullContent;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.content) {
              fullContent += delta.content;
              onChunk?.(delta.content);
            }
            
            if (delta?.reasoning && onReasoning) {
              reasoning += delta.reasoning;
              onReasoning(reasoning);
            }
          } catch (e) {
            // Ignore malformed JSON chunks
            continue;
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '流式响应处理失败';
    onError?.(errorMessage);
    throw error;
  } finally {
    reader.releaseLock();
  }

  return fullContent;
}