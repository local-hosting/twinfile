import type { TwinfileSummaryBlock, TwinfileSummaryLayoutV1, TwinfileSummaryV1, TwinfileUseMode } from '@local-hosting/twinfile-core';

import { summaryLayoutsForHtml } from './card-layouts.js';
import { escapeHtml } from './escape-html.js';

/** Tailwind v4 browser build for self-contained `twin card --html-doc` previews. */
export const TWINFILE_SUMMARY_TAILWIND_BROWSER =
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

export type RenderTwinfileSummaryHtmlOptions = {
  includeDocument?: boolean;
  /** Layout id (default: primary `place` card layout). */
  mode?: TwinfileUseMode;
  /** Load Tailwind in the document head (default: true when `includeDocument`). */
  tailwind?: boolean;
};

function hostSignalWire(row: { id: string; kind?: string }): string | null {
  const wire = row.kind?.includes(':') ? row.kind : row.id;
  return wire.startsWith('signal:') ? wire : null;
}

function portDotMarkup(side: 'in' | 'out', alignWithFirstLine = false): string {
  const border = side === 'in' ? 'border-emerald-500' : 'border-amber-500';
  const offset = alignWithFirstLine ? 'mt-1 ' : '';
  return `<span class="${offset}h-2 w-2 shrink-0 rounded-full border-2 ${border} bg-white dark:bg-zinc-900" aria-hidden="true"></span>`;
}

const PORT_LI =
  'flex gap-1.5 border-b border-zinc-200 pb-2 last:border-b-0 last:pb-0 dark:border-zinc-700';

function renderPortList(
  rows: Array<{ id: string; label: string; kind?: string; hint?: string }>,
  side: 'in' | 'out',
): string {
  if (rows.length === 0) {
    const align = side === 'out' ? ' text-right' : '';
    return `<p class="m-0 text-xs text-zinc-400 dark:text-zinc-500${align}">None</p>`;
  }
  return `<ul class="m-0 list-none space-y-2 p-0 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
    ${rows
      .map((row) => {
        const signalWire = hostSignalWire(row);
        const alignText = side === 'out' ? ' text-right' : '';
        if (signalWire) {
          const text = `<span class="min-w-0 font-mono text-xs leading-none text-zinc-700 dark:text-zinc-300${alignText}">${escapeHtml(signalWire)}</span>`;
          if (side === 'in') {
            return `<li class="${PORT_LI} items-center">${portDotMarkup('in')}${text}</li>`;
          }
          return `<li class="${PORT_LI} items-center justify-end">${text}${portDotMarkup('out')}</li>`;
        }
        const hint = row.hint
          ? `<span class="mt-0.5 block text-zinc-500 dark:text-zinc-500">${escapeHtml(row.hint)}</span>`
          : '';
        const showTypeId = Boolean(row.kind && row.kind !== 'control' && row.kind !== row.label);
        const monoId = showTypeId
          ? `<span class="mt-0.5 block font-mono text-[0.65rem] text-zinc-400 dark:text-zinc-500">${escapeHtml(row.kind ?? row.id)}</span>`
          : '';
        const body = `<span class="min-w-0"><strong class="font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(row.label)}</strong>${monoId}${hint}</span>`;
        if (side === 'in') {
          return `<li class="${PORT_LI} items-start">${portDotMarkup('in', true)}${body}</li>`;
        }
        return `<li class="${PORT_LI} items-start justify-end">${body}${portDotMarkup('out', true)}</li>`;
      })
      .join('')}
  </ul>`;
}

function renderBlockHtml(block: TwinfileSummaryBlock): string {
  switch (block.type) {
    case 'hero': {
      const chips =
        block.chips.length > 0
          ? `<div class="mt-2.5 flex flex-wrap gap-1.5">
      ${block.chips.map((c) => `<span class="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">${escapeHtml(c)}</span>`).join('')}
    </div>`
          : '';
      return `<header class="flex gap-3 border-b border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/60">
  <span class="min-w-12 text-center text-2xl font-bold leading-tight text-sky-600 dark:text-sky-400" aria-hidden="true">${escapeHtml(block.icon)}</span>
  <div class="min-w-0 flex-1">
    <h1 class="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">${escapeHtml(block.title)}</h1>
    ${block.subtitle ? `<p class="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400">${escapeHtml(block.subtitle)}</p>` : ''}
    ${chips}
  </div>
</header>`;
    }
    case 'stats':
      return `<section class="border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
  <h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">${escapeHtml(block.title)}</h2>
  <div class="grid grid-cols-3 gap-2">
    ${block.items
      .map((item) => {
        const title = item.hint ? ` title="${escapeHtml(item.hint)}"` : '';
        return `<div class="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-center dark:border-zinc-700 dark:bg-zinc-950"${title}>
      <span class="block text-xl font-bold text-sky-600 dark:text-sky-400">${escapeHtml(String(item.value))}</span>
      <span class="mt-0.5 block text-[0.65rem] leading-tight text-zinc-500 dark:text-zinc-400">${escapeHtml(item.label)}</span>
    </div>`;
      })
      .join('')}
  </div>
</section>`;
    case 'list':
      return `<section class="border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
  <h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">${escapeHtml(block.title)}</h2>
  <dl class="text-sm">
    ${block.rows
      .map(
        (row) =>
          `<div class="flex items-baseline justify-between gap-3 border-t border-zinc-200 py-1.5 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <dt class="shrink-0 text-zinc-500 dark:text-zinc-400">${escapeHtml(row.label)}</dt>
      <dd class="min-w-0 text-right font-medium text-zinc-800 dark:text-zinc-200">${escapeHtml(String(row.value ?? '—'))}</dd>
    </div>`,
      )
      .join('')}
  </dl>
</section>`;
    case 'ports':
      if (block.direction === 'in') {
        return `<section class="border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
  <h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
    ${escapeHtml(block.title)} <span class="text-emerald-600 dark:text-emerald-400">→</span>
  </h2>
  ${renderPortList(block.rows, 'in')}
</section>`;
      }
      return `<section class="border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
  <h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
    ${escapeHtml(block.title)} <span class="text-amber-600 dark:text-amber-400">→</span>
  </h2>
  ${renderPortList(block.rows, 'out')}
</section>`;
    case 'io': {
      const sectionTitle = block.title
        ? `<h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">${escapeHtml(block.title)}</h2>`
        : '';
      return `<section class="border-b border-zinc-200 px-3 py-3 last:border-b-0 dark:border-zinc-800">
  ${sectionTitle}
  <div class="grid grid-cols-2 gap-3 divide-x divide-zinc-200 dark:divide-zinc-700">
    <div class="min-w-0 pr-2">
      <h3 class="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
        In <span>→</span>
      </h3>
      ${renderPortList(block.inputs, 'in')}
    </div>
    <div class="min-w-0 pl-2">
      <h3 class="mb-2 text-right text-[0.65rem] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
        Out <span aria-hidden="true">→</span>
      </h3>
      ${renderPortList(block.outputs, 'out')}
    </div>
  </div>
</section>`;
    }
    case 'note':
      return `<p class="border-b border-zinc-200 px-4 py-2.5 text-xs leading-snug text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">${escapeHtml(block.text)}</p>`;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

function renderLayoutArticle(card: TwinfileSummaryV1, layout: TwinfileSummaryLayoutV1): string {
  const inner = layout.blocks.map(renderBlockHtml).join('\n');
  const foot = card.digest
    ? `<footer class="break-all px-4 py-2.5 text-[0.65rem] text-zinc-500 dark:text-zinc-400">${escapeHtml(card.digest)}</footer>`
    : '';
  return `<article class="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" data-schema="${escapeHtml(card.schema)}" data-mode="${layout.mode}" data-layout-title="${escapeHtml(layout.title)}">
${inner}
${foot}
</article>`;
}

function tailwindHead(useTailwind: boolean): string {
  if (!useTailwind) return '';
  return `<script src="${TWINFILE_SUMMARY_TAILWIND_BROWSER}"></script>`;
}

/** Workbench / Storybook canvas: render a twinfile card to HTML (uses viewer.css Tailwind). */
export function renderTwinfileSummaryHtml(
  card: TwinfileSummaryV1,
  options?: RenderTwinfileSummaryHtmlOptions,
): string {
  const includeDocument = options?.includeDocument === true;
  const useTailwind = options?.tailwind ?? includeDocument;

  const layouts = summaryLayoutsForHtml(card, options?.mode);
  const article = `<div class="flex flex-wrap items-start gap-4">${layouts.map((layout) => renderLayoutArticle(card, layout)).join('\n')}</div>`;

  if (!includeDocument) {
    return article;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${tailwindHead(useTailwind)}
</head>
<body class="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
  ${article}
</body>
</html>`;
}
