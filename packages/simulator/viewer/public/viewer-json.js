/** Syntax blocks for the examples viewer — global `hljs` from `/vendor/highlight.js`. */

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function jsonViewerText(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export function codeBlockHtml(text, language, extraClass = 'text-xs') {
  const source = typeof text === 'string' ? text : jsonViewerText(text);
  const lang = language === 'yaml' ? 'yaml' : 'json';
  const cls = extraClass ? `code-viewer json-viewer ${extraClass}` : 'code-viewer json-viewer';
  const hljs = globalThis.hljs;
  if (hljs?.highlight) {
    try {
      const { value: inner } = hljs.highlight(source, { language: lang });
      return `<pre class="${cls}"><code class="language-${lang} hljs">${inner}</code></pre>`;
    } catch {
      /* plain fallback */
    }
  }
  return `<pre class="${cls}"><code class="language-${lang}">${escapeHtml(source)}</code></pre>`;
}

export function jsonViewerHtml(value, extraClass = 'text-xs') {
  return codeBlockHtml(jsonViewerText(value), 'json', extraClass);
}

export function twinfileSourceHtml(filename, text, extraClass = 'text-xs max-h-[calc(100vh-8rem)]') {
  return `<article class="max-w-4xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    <header class="border-b border-zinc-100 px-4 py-2">
      <p class="font-mono text-xs text-zinc-500">${escapeHtml(filename)}</p>
    </header>
    ${codeBlockHtml(text, 'yaml', extraClass)}
  </article>`;
}

export function paintJsonViewers(root = document) {
  paintCodeViewers(root);
}

export function paintCodeViewers(root = document) {
  const hljs = globalThis.hljs;
  if (!hljs?.highlightElement) return;
  for (const el of root.querySelectorAll('pre.code-viewer code[class*="language-"]:not(.hljs)')) {
    hljs.highlightElement(el);
  }
}
