import {
  buildLayerDisplayLabel,
  formatBuildLayerScope,
  type ProcessorsResourceV1,
  type TwinfileManifestRecipe,
  type TwinfileUseMode,
} from '@local-hosting/twinfile-core';

import { renderDisclosureArticle } from '../dtpr/render-disclosures.js';
import type { LayoutOverview, RunOverview, WorkbenchStoryVariation } from '../types/workbench-story.js';
import { renderTwinfileSummaryHtml } from './render-card-html-string.js';
import { renderJsonViewerHtml, renderTwinfileSourceBlockHtml } from './json-viewer-html.js';

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderTwinfileSourceHtml(filename: string, text: string): string {
  return [
    '<div class="viewer-variation viewer-variation--twinfile max-w-4xl overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">',
    `<header class="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800"><p class="font-mono text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(filename)}</p></header>`,
    renderTwinfileSourceBlockHtml(text),
    '</div>',
  ].join('');
}

function sectionHeading(title: string): string {
  return `<h3 class="mb-2 mt-4 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">${escapeHtml(title)}</h3>`;
}

type BuildLayerRow = {
  index: number;
  kind: string;
  ref: string;
  chain: string;
  label?: string;
  imageLayerCount?: number;
  detail?: BuildLayerRow[];
};

function renderBuildLayerRow(layer: BuildLayerRow, nested = false): string {
  const scope = formatBuildLayerScope(layer.ref);
  const rowClass = nested
    ? 'border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40'
    : 'border-b border-zinc-100 dark:border-zinc-800';
  const pad = nested ? 'pl-6' : '';
  return `<tr class="${rowClass}"><td class="py-1 pr-2 font-mono text-xs ${pad}">${layer.index}</td><td class="py-1 pr-2 text-xs text-zinc-600 dark:text-zinc-400">${escapeHtml(scope)}</td><td class="py-1 pr-2 font-mono text-xs">${escapeHtml(layer.kind)}</td><td class="py-1 pr-2 text-xs" title="${escapeHtml(layer.ref)}">${escapeHtml(buildLayerDisplayLabel(layer))}</td><td class="py-1 font-mono text-[0.65rem] text-zinc-500">${escapeHtml(layer.chain.slice(0, 16))}…</td></tr>`;
}

function renderRecipeTable(recipe: TwinfileManifestRecipe): string {
  const fromRow = recipe.from
    ? `<tr class="border-b border-zinc-100 dark:border-zinc-800"><td class="py-1 pr-2 font-mono text-xs">—</td><td class="py-1 text-xs text-zinc-600 dark:text-zinc-400">FROM</td><td class="py-1 font-mono text-xs" colspan="3">${escapeHtml(recipe.from)}</td></tr>`
    : '';
  const stepRows = recipe.steps
    .map(
      (step) =>
        `<tr class="border-b border-zinc-100 dark:border-zinc-800"><td class="py-1 pr-2 font-mono text-xs">${step.stepIndex}</td><td class="py-1 text-xs text-zinc-600 dark:text-zinc-400">local</td><td class="py-1 text-xs" colspan="3">${escapeHtml(step.label)}</td></tr>`,
    )
    .join('');
  return `<div class="mb-4"><h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Twinfile recipe</h4><table class="w-full text-left"><thead><tr class="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700"><th class="py-1 pr-2">#</th><th class="py-1 pr-2">scope</th><th class="py-1" colspan="3">instruction</th></tr></thead><tbody>${fromRow}${stepRows}</tbody></table></div>`;
}

function renderBuildLayersHtml(recipe: TwinfileManifestRecipe, layers: BuildLayerRow[]): string {
  const rows = layers
    .flatMap((layer) => {
      const main = [renderBuildLayerRow(layer)];
      if (layer.detail?.length) {
        main.push(...layer.detail.map((sub) => renderBuildLayerRow(sub, true)));
      }
      return main;
    })
    .join('');
  return `<div class="viewer-variation viewer-variation--layers overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"><h3 class="mb-1 text-sm font-semibold">Build history</h3><p class="mb-3 text-xs text-zinc-500 dark:text-zinc-400"><strong class="font-medium text-zinc-700 dark:text-zinc-300">Recipe</strong> = your <code class="text-[0.7rem]">.twin.yaml</code> head instructions. <strong class="font-medium text-zinc-700 dark:text-zinc-300">Image layers</strong> = content-addressed merge chain (<code class="text-[0.7rem]">twin layers</code>); a <code class="text-[0.7rem]">copy:</code> step may expand into several layers.</p>${renderRecipeTable(recipe)}<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Image layers</h4><table class="w-full text-left"><thead><tr class="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700"><th class="py-1 pr-2">#</th><th class="py-1 pr-2">scope</th><th class="py-1 pr-2">kind</th><th class="py-1 pr-2">step</th><th class="py-1">chain</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export type RenderWorkbenchStoryOptions = {
  focusSpaceId?: string;
  /** Spaces in use at session playhead (`timeline.at(t)` occupancy). */
  highlightSpaceIds?: string[];
};

function layoutSpaceRowClass(
  spaceId: string,
  options?: RenderWorkbenchStoryOptions,
): string {
  const focused = options?.focusSpaceId === spaceId;
  const occupied = options?.highlightSpaceIds?.includes(spaceId) ?? false;
  if (focused && occupied) {
    return 'border-b border-sky-300 bg-sky-50 ring-1 ring-amber-400/60 dark:border-sky-900 dark:bg-sky-950/40';
  }
  if (focused) {
    return 'border-b border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40';
  }
  if (occupied) {
    return 'border-b border-amber-200 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/30 twinfile-viewer-space--session';
  }
  return 'border-b border-zinc-100 dark:border-zinc-800';
}

function renderLayoutOverviewHtml(data: LayoutOverview, options?: RenderWorkbenchStoryOptions): string {
  const parts = [
    '<div class="viewer-layout rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">',
  ];
  if (data.placeName || data.layoutArchetype) {
    parts.push(sectionHeading('Site'));
    parts.push('<ul class="mb-1 list-disc pl-5 text-zinc-700 dark:text-zinc-300">');
    if (data.placeName) parts.push(`<li>${escapeHtml(data.placeName)}</li>`);
    if (data.layoutArchetype) parts.push(`<li>Archetype: ${escapeHtml(data.layoutArchetype)}</li>`);
    parts.push('</ul>');
  }
  if (data.geo) {
    const { lat, lon } = data.geo;
    const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
    parts.push(
      `<p class="mb-2"><a class="text-blue-600 underline dark:text-blue-400" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${lat.toFixed(4)}, ${lon.toFixed(4)} — map</a></p>`,
    );
  }
  if (data.levels.length) {
    parts.push(sectionHeading('Levels (vertical rollup)'));
    parts.push('<ul class="mb-1 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300">');
    for (const row of data.levels) {
      parts.push(
        `<li><span class="font-mono">${escapeHtml(row.id)}</span>${row.name ? ` — ${escapeHtml(row.name)}` : ''}</li>`,
      );
    }
    parts.push('</ul>');
  }
  if (data.spaces.length) {
    const showParent = data.spaces.some((row) => row.parent);
    parts.push(sectionHeading('Cells'));
    if (options?.highlightSpaceIds?.length) {
      parts.push(
        `<p class="mb-2 text-xs text-amber-800 dark:text-amber-200/90">session occupancy · ${options.highlightSpaceIds.map((id) => escapeHtml(id)).join(', ')}</p>`,
      );
    }
    parts.push(
      '<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b border-zinc-200 dark:border-zinc-700"><th class="py-1 pr-2">ID</th><th class="py-1 pr-2">Name</th><th class="py-1 pr-2">Level</th>',
    );
    if (showParent) parts.push('<th class="py-1 pr-2">Rollup parent</th>');
    parts.push('</tr></thead><tbody>');
    for (const row of data.spaces.slice(0, 24)) {
      const trClass = layoutSpaceRowClass(row.id, options);
      parts.push(
        `<tr id="viewer-space-${escapeHtml(row.id)}" class="${trClass}" data-session-occupancy="${options?.highlightSpaceIds?.includes(row.id) ? 'true' : 'false'}"><td class="py-1 pr-2 font-mono">${escapeHtml(row.id)}</td><td class="py-1 pr-2">${escapeHtml(row.name ?? '')}</td><td class="py-1 pr-2">${escapeHtml(row.level ?? '')}</td>`,
      );
      if (showParent) {
        parts.push(`<td class="py-1 pr-2 font-mono text-zinc-500">${escapeHtml(row.parent ?? '')}</td>`);
      }
      parts.push('</tr>');
    }
    if (data.spaces.length > 24) {
      const cols = showParent ? 4 : 3;
      parts.push(`<tr><td colspan="${cols}" class="py-2 text-zinc-500">… ${data.spaces.length - 24} more</td></tr>`);
    }
    parts.push('</tbody></table></div>');
  }
  if (data.openings.length) {
    parts.push(sectionHeading('Passages'));
    parts.push(
      '<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b border-zinc-200 dark:border-zinc-700"><th class="py-1 pr-2">ID</th><th class="py-1 pr-2">Kind</th><th class="py-1 pr-2">Connects</th><th class="py-1 pr-2">State</th></tr></thead><tbody>',
    );
    for (const row of data.openings.slice(0, 24)) {
      const connects = row.connects.map((id) => escapeHtml(id)).join(' ↔ ');
      parts.push(
        `<tr class="border-b border-zinc-100 dark:border-zinc-800"><td class="py-1 pr-2 font-mono">${escapeHtml(row.id)}</td><td class="py-1 pr-2">${escapeHtml(row.kind ?? '')}</td><td class="py-1 pr-2 font-mono">${connects}</td><td class="py-1 pr-2">${escapeHtml(row.state ?? '')}</td></tr>`,
      );
    }
    if (data.openings.length > 24) {
      parts.push(`<tr><td colspan="4" class="py-2 text-zinc-500">… ${data.openings.length - 24} more</td></tr>`);
    }
    parts.push('</tbody></table></div>');
  }
  if (data.routes.length) {
    parts.push(sectionHeading('Paths'));
    parts.push(
      '<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b border-zinc-200 dark:border-zinc-700"><th class="py-1 pr-2">ID</th><th class="py-1 pr-2">From → to</th><th class="py-1 pr-2">m</th><th class="py-1 pr-2">Kind</th></tr></thead><tbody>',
    );
    for (const row of data.routes.slice(0, 24)) {
      parts.push(
        `<tr class="border-b border-zinc-100 dark:border-zinc-800"><td class="py-1 pr-2 font-mono">${escapeHtml(row.id)}</td><td class="py-1 pr-2 font-mono">${escapeHtml(row.from)} → ${escapeHtml(row.to)}</td><td class="py-1 pr-2">${row.length_m ?? ''}</td><td class="py-1 pr-2">${escapeHtml(row.kind ?? '')}</td></tr>`,
      );
    }
    if (data.routes.length > 24) {
      parts.push(`<tr><td colspan="4" class="py-2 text-zinc-500">… ${data.routes.length - 24} more</td></tr>`);
    }
    parts.push('</tbody></table></div>');
  }
  parts.push('</div>');
  return parts.join('');
}

function renderProcessorsPatchHtml(resource: ProcessorsResourceV1): string {
  const parts = [
    '<div class="viewer-variation viewer-variation--processors rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">',
    '<p class="mb-3 text-xs text-zinc-600 dark:text-zinc-400">Wiring truth from core — canvas coordinates are host-owned. Hook any UI framework on <code class="font-mono text-[0.7rem]">resource.ui</code>.</p>',
    sectionHeading('Processors'),
    '<ul class="mb-3 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300">',
  ];
  for (const mod of resource.ui.modules) {
    parts.push(
      `<li><span class="font-mono">${escapeHtml(mod.id)}</span> — ${escapeHtml(mod.type)}<span class="text-zinc-500"> (${mod.outputs.length} out / ${mod.inputs.length} in)</span></li>`,
    );
  }
  parts.push('</ul>', sectionHeading('Outlets'));
  if (resource.ui.connections.length === 0) {
    parts.push('<p class="text-xs text-zinc-500">No cords.</p>');
  } else {
    parts.push('<ul class="list-disc pl-5 text-xs font-mono text-zinc-700 dark:text-zinc-300">');
    for (const cord of resource.ui.connections) {
      const wire = cord.wire ? ` <span class="text-zinc-500">[${escapeHtml(cord.wire)}]</span>` : '';
      parts.push(
        `<li>${escapeHtml(cord.from.module)}.${escapeHtml(cord.from.port)} → ${escapeHtml(cord.to.module)}.${escapeHtml(cord.to.port)}${wire}</li>`,
      );
    }
    parts.push('</ul>');
  }
  parts.push('</div>');
  return parts.join('');
}

function renderRunOverviewHtml(run: RunOverview): string {
  const parts = [
    '<div class="viewer-variation viewer-variation--run rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">',
    `<p class="mb-1 text-xs text-zinc-500">${escapeHtml(run.id)} @ ${escapeHtml(run.version)}</p>`,
    `<h3 class="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">${escapeHtml(run.name)}</h3>`,
  ];
  if (run.question) {
    parts.push(sectionHeading('Question'));
    parts.push(`<p class="text-zinc-700 dark:text-zinc-300">${escapeHtml(run.question)}</p>`);
  }
  if (run.runner) {
    parts.push(sectionHeading('Runner'));
    parts.push(`<p class="font-mono text-xs text-zinc-600 dark:text-zinc-400">${escapeHtml(run.runner)}</p>`);
    parts.push(
      '<p class="mt-1 text-xs text-zinc-500">Offline <code class="text-[0.7rem]">twin run</code> only — not live playback.</p>',
    );
  }
  if (run.clock) {
    parts.push(sectionHeading('Clock'));
    parts.push(renderJsonViewerHtml(run.clock));
  }
  if (run.resolvedArgs && Object.keys(run.resolvedArgs).length > 0) {
    parts.push(sectionHeading('Args'));
    parts.push(renderJsonViewerHtml(run.resolvedArgs));
  }
  parts.push('</div>');
  return parts.join('');
}

export type WorkbenchStoryPageSection = {
  id: string;
  label: string;
  story: WorkbenchStoryVariation;
};

/** One scrollable workbench page: Card, Topology, Layers, … in catalog order. */
export function renderWorkbenchStoryPageHtml(
  sections: WorkbenchStoryPageSection[],
  mode: TwinfileUseMode,
  options?: RenderWorkbenchStoryOptions,
): string {
  return sections
    .map(
      ({ id, label, story }) =>
        `<section class="twinfile-workbench__canvas-section" id="workbench-section-${escapeHtml(id)}">` +
        `<h2 class="twinfile-workbench__canvas-section-title">${escapeHtml(label)}</h2>` +
        `${renderWorkbenchStoryHtml(story, mode, options)}` +
        `</section>`,
    )
    .join('\n');
}

/** Storybook canvas: args → HTML (manager UI stays in React). */
export function renderWorkbenchStoryHtml(
  story: WorkbenchStoryVariation,
  mode: TwinfileUseMode,
  options?: RenderWorkbenchStoryOptions,
): string {
  switch (story.kind) {
    case 'summary':
      return `<div class="viewer-variation viewer-variation--summary flex flex-col items-start">${renderTwinfileSummaryHtml(story.summary, { mode })}</div>`;
    case 'twinfile':
      return renderTwinfileSourceHtml(story.filename, story.text);
    case 'layout':
      return `<div class="viewer-variation viewer-variation--layout">${renderLayoutOverviewHtml(story.layout, options)}</div>`;
    case 'disclosures': {
      const body = story.disclosures.map((row) => renderDisclosureArticle(row)).join('');
      return `<div class="viewer-variation viewer-variation--disclosures flex flex-col gap-4">${body}</div>`;
    }
    case 'processors':
      return renderProcessorsPatchHtml(story.processors);
    case 'layers':
      return renderBuildLayersHtml(story.recipe, story.layers);
    case 'run':
      return renderRunOverviewHtml(story.run);
    default: {
      const _exhaustive: never = story;
      return _exhaustive;
    }
  }
}
