import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderLatex(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: '#ef4444',
      strict: false,
    });
  } catch {
    return `<span style="color:#ef4444">[Render error: ${latex}]</span>`;
  }
}

export function renderMarkdownWithLatex(content: string): string {
  let html = content;

  // Extract code blocks first to protect them
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
  });

  // Extract inline code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `\x00INLINECODE${inlineCodes.length - 1}\x00`;
  });

  // Display math: $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex: string) => {
    return renderLatex(latex.trim(), true);
  });

  // Inline math: $...$
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, latex: string) => {
    return renderLatex(latex.trim(), false);
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-slate-800">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-slate-800">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-900">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-2 space-y-1">${match}</ul>`);

  // Paragraphs / line breaks
  html = html
    .split(/\n\n+/)
    .map((block) => {
      if (block.match(/^\s*<(h[1-6]|ul|ol|li|pre|blockquote)/)) return block;
      if (block.trim() === '') return '';
      if (block.includes('\x00CODEBLOCK')) return block;
      return `<p class="my-2 leading-relaxed">${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  // Restore code blocks
  html = html.replace(/\x00CODEBLOCK(\d+)\x00/g, (_, i) => {
    return `<pre class="bg-slate-800 text-slate-100 rounded-lg p-4 my-3 overflow-x-auto"><code>${escapeHtml(codeBlocks[parseInt(i)])}</code></pre>`;
  });

  // Restore inline code
  html = html.replace(/\x00INLINECODE(\d+)\x00/g, (_, i) => {
    return `<code class="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 text-sm font-mono">${escapeHtml(inlineCodes[parseInt(i)])}</code>`;
  });

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
