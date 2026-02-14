import { useEffect, useState } from 'react';
import './MarkdownPreview.css';

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // シンプルなMarkdown → HTML変換
    // 本格的なパーサーではなく、軽量な実装
    const lines = markdown.split('\n');
    let result = '';
    let inList = false;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (inList) { result += '</ul>'; inList = false; }
        result += `<h2>${escapeHtml(line.slice(3))}</h2>`;
      } else if (line.startsWith('### ')) {
        if (inList) { result += '</ul>'; inList = false; }
        result += `<h3>${escapeHtml(line.slice(4))}</h3>`;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) { result += '<ul>'; inList = true; }
        result += `<li>${parseInline(line.slice(2))}</li>`;
      } else if (line.trim() === '') {
        if (inList) { result += '</ul>'; inList = false; }
        result += '<br>';
      } else {
        if (inList) { result += '</ul>'; inList = false; }
        result += `<p>${parseInline(line)}</p>`;
      }
    }

    if (inList) result += '</ul>';
    setHtml(result);
  }, [markdown]);

  return (
    <div 
      className="markdown-preview" 
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function parseInline(text: string): string {
  let result = escapeHtml(text);
  
  // **bold** → <strong>
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // *italic* → <em>
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // `code` → <code>
  result = result.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // [text](url) → <a>
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  return result;
}
