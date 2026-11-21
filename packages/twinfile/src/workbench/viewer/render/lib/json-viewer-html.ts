import { escapeHtml } from './escape-html.js';

export function jsonViewerText(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/** Escaped source in a `code-viewer` shell — pair with client `/vendor/highlight.js`. */
export function renderCodeViewerHtml(text: string, language: 'json' | 'yaml', extraClass = 'text-xs'): string {
  const cls = extraClass ? `code-viewer json-viewer ${extraClass}` : 'code-viewer json-viewer';
  return `<pre class="${cls}"><code class="language-${language}">${escapeHtml(text)}</code></pre>`;
}

export function renderJsonViewerHtml(value: unknown, extraClass = 'text-xs'): string {
  return renderCodeViewerHtml(jsonViewerText(value), 'json', extraClass);
}

export function renderTwinfileSourceBlockHtml(text: string, extraClass = 'text-xs max-h-[calc(100vh-8rem)]'): string {
  return renderCodeViewerHtml(text, 'yaml', extraClass);
}
