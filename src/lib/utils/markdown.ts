import { marked } from 'marked';

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(content: string): string {
  try {
    return marked.parse(content);
  } catch (error) {
    console.error('Markdown解析错误:', error);
    
    // 回退到基本的HTML转换
    let formatted = content
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    return formatted;
  }
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function limitText(text: string, maxLength: number = 256): string {
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}