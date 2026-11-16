import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import {
  formatTwinfileSummaryMarkdown,
  isRunUnit,
  listDtprDisclosures,
  type DtprDisclosureRow,
  type TwinfileSummaryV1,
} from '@doppler-group/twinfile-core';
import { PlaceHost, TFPlace } from '@doppler-group/twinfile-simulator';

import type { LayoutOverview, ViewerBuildLayerRow } from '../../types/workbench-api.js';
import { buildViewerBuildHistory } from '../payloads/viewer-build-layers.js';
import {
  buildViewerSummaryPayload,
  viewerSummarySectionIds,
  viewerShowsSummarySections,
} from '../payloads/viewer-summary.js';
import { buildLayoutOverview } from '../payloads/viewer-layout.js';
import { buildViewerProcessorsPayload } from '../payloads/viewer-processors.js';
import { buildRunOverview } from '../payloads/viewer-run.js';
import type { RunOverview } from '../../types/workbench-api.js';
import { readViewerTwinfileYaml } from './viewer-source.js';

export type ViewerStoryTab = {
  id: string;
  label: string;
  kind: 'summary' | 'twinfile' | 'layout' | 'disclosures' | 'layers' | 'processors' | 'run';
};

export type ViewerStoryVariation =
  | { id: string; label: string; kind: 'summary'; summary: TwinfileSummaryV1 }
  | { id: string; label: string; kind: 'twinfile'; filename: string; text: string }
  | { id: string; label: string; kind: 'layout'; layout: LayoutOverview }
  | { id: string; label: string; kind: 'disclosures'; disclosures: DtprDisclosureRow[] }
  | {
      id: string;
      label: string;
      kind: 'layers';
      recipe: import('@doppler-group/twinfile-core').TwinfileManifestRecipe;
      layers: ViewerBuildLayerRow[];
      detailLayers: ViewerBuildLayerRow[];
    }
  | { id: string; label: string; kind: 'processors'; processors: NonNullable<ReturnType<typeof buildViewerProcessorsPayload>>['resource'] }
  | { id: string; label: string; kind: 'run'; run: RunOverview };

export type ViewerTwinfilePage = {
  /** Story args for the editor canvas (no HTML — Storybook-style). */
  schema: 'twinfile.viewer.twinfile-page.v1';
  variations: ViewerStoryVariation[];
  defaultVariationId: string;
  docsMarkdown: string;
};

function variationIdFromSectionId(sectionId: string): string {
  if (sectionId === 'summary.head' || sectionId === 'card.head') return 'summary';
  if (sectionId.startsWith('summary.patch.') || sectionId.startsWith('card.patch.')) {
    const prefix = sectionId.startsWith('summary.patch.') ? 'summary.patch.' : 'card.patch.';
    return `patch-${sectionId.slice(prefix.length)}`;
  }
  return sectionId.replace(/\./g, '-');
}

function sectionIdFromVariationId(variationId: string): string | undefined {
  if (variationId === 'summary' || variationId === 'card') return 'summary.head';
  if (variationId.startsWith('patch-')) return `summary.patch.${variationId.slice('patch-'.length)}`;
  if (
    variationId === 'twinfile' ||
    variationId === 'layout' ||
    variationId === 'disclosures' ||
    variationId === 'layers' ||
    variationId === 'processors' ||
    variationId === 'run'
  ) {
    return variationId;
  }
  return undefined;
}

/** Tab list only (no card/layout payloads). */
export function listViewerStoryTabs(result: BuildTwinfileResult): ViewerStoryTab[] {
  if (!viewerShowsSummarySections(result.loaded.twinfile, result.loaded)) {
    const tabs: ViewerStoryTab[] = [...listLensStoryTabs(result)];
    tabs.push({
      id: 'twinfile',
      label: isRunUnit(result.loaded) ? 'Preset' : 'Twinfile',
      kind: 'twinfile',
    });
    return tabs;
  }
  const tabs: ViewerStoryTab[] = [];
  tabs.push({ id: 'summary', label: 'Summary', kind: 'summary' });
  tabs.push({ id: 'twinfile', label: 'Twinfile', kind: 'twinfile' });
  const layout = buildLayoutOverview(result.data);
  const hasLayout =
    layout.spaces.length > 0 ||
    layout.openings.length > 0 ||
    layout.routes.length > 0 ||
    layout.levels.length > 0 ||
    Boolean(layout.placeName);
  if (hasLayout) {
    tabs.push({ id: 'layout', label: 'Topology', kind: 'layout' });
  }
  if (listDtprDisclosures(result.data).length) {
    tabs.push({ id: 'disclosures', label: 'Disclosures', kind: 'disclosures' });
  }
  if (result.layers.length > 0) {
    tabs.push({ id: 'layers', label: 'Build history', kind: 'layers' });
  }
  if (buildViewerProcessorsPayload(result)) {
    tabs.push({ id: 'processors', label: 'Patch', kind: 'processors' });
  }
  return tabs;
}

/** Programme lens tabs (scenario run overview) — not part of the host place card. */
export function listLensStoryTabs(session: BuildTwinfileResult): ViewerStoryTab[] {
  if (buildRunOverview(session)) {
    return [{ id: 'run', label: 'Run', kind: 'run' }];
  }
  return [];
}

export function defaultViewerStoryVariationId(tabs: ViewerStoryTab[]): string {
  return (
    tabs.find((v) => v.id === 'summary')?.id ??
    tabs.find((v) => v.id === 'run')?.id ??
    tabs.find((v) => v.kind === 'summary')?.id ??
    tabs[0]?.id ??
    ''
  );
}

/** Build one evaluated view (card, layout, or disclosures). */
export function buildViewerStoryVariation(
  result: BuildTwinfileResult,
  variationId: string,
): ViewerStoryVariation | undefined {
  if (variationId === 'twinfile') {
    const source = readViewerTwinfileYaml(result.loaded.root);
    if (!source.ok) return undefined;
    return {
      id: 'twinfile',
      label: 'Twinfile',
      kind: 'twinfile',
      filename: source.value.twinfile,
      text: source.value.text,
    };
  }
  if (variationId === 'layout') {
    const layout = buildLayoutOverview(result.data);
    const hasLayout =
      layout.spaces.length > 0 ||
      layout.openings.length > 0 ||
      layout.routes.length > 0 ||
      layout.levels.length > 0 ||
      Boolean(layout.placeName);
    if (!hasLayout) return undefined;
    return { id: 'layout', label: 'Topology', kind: 'layout', layout };
  }
  if (variationId === 'disclosures') {
    const disclosures = listDtprDisclosures(result.data);
    if (!disclosures.length) return undefined;
    return { id: 'disclosures', label: 'Disclosures', kind: 'disclosures', disclosures };
  }
  if (variationId === 'layers') {
    const history = buildViewerBuildHistory(result);
    if (!history.layers.length) return undefined;
    return {
      id: 'layers',
      label: 'Build history',
      kind: 'layers',
      recipe: history.recipe,
      layers: history.layers,
      detailLayers: history.detailLayers,
    };
  }
  if (variationId === 'processors') {
    const payload = buildViewerProcessorsPayload(result);
    if (!payload) return undefined;
    return { id: 'processors', label: 'Patch', kind: 'processors', processors: payload.resource };
  }
  if (variationId === 'run') {
    const run = buildRunOverview(result);
    if (!run) return undefined;
    return { id: 'run', label: 'Run', kind: 'run', run };
  }

  const sectionId = sectionIdFromVariationId(variationId);
  if (
    !sectionId ||
    (!sectionId.startsWith('summary.') && !sectionId.startsWith('card.'))
  ) {
    return undefined;
  }
  if (!viewerShowsSummarySections(result.loaded.twinfile, result.loaded)) return undefined;
  const row = viewerSummarySectionIds(result).find((r) => r.id === sectionId);
  if (!row) return undefined;
  const payload = buildViewerSummaryPayload(result, sectionId);
  if (!payload?.summary) return undefined;
  return {
    id: variationIdFromSectionId(row.id),
    label: row.label,
    kind: 'summary',
    summary: payload.summary,
  };
}

/** Same as {@link buildViewerStoryVariation} (async for hosts that already await). */
export async function buildViewerStoryVariationAsync(
  result: BuildTwinfileResult,
  variationId: string,
): Promise<ViewerStoryVariation | undefined> {
  return buildViewerStoryVariation(result, variationId);
}

/** Compose → full story list (all variations). Prefer index + per-variation API for hosts. */
export function buildViewerTwinfilePage(result: BuildTwinfileResult): ViewerTwinfilePage {
  const tabs = listViewerStoryTabs(result);
  const variations: ViewerStoryVariation[] = [];
  for (const tab of tabs) {
    const story = buildViewerStoryVariation(result, tab.id);
    if (story) variations.push(story);
  }

  let docsMarkdown = '';
  const host = PlaceHost.for(TFPlace.compose(result));
  if (viewerShowsSummarySections(result.loaded.twinfile, result.loaded)) {
    docsMarkdown = host.summaryMarkdown();
  } else {
    docsMarkdown = formatTwinfileSummaryMarkdown(host.summary());
  }

  return {
    schema: 'twinfile.viewer.twinfile-page.v1',
    variations,
    defaultVariationId: defaultViewerStoryVariationId(tabs),
    docsMarkdown: docsMarkdown.trim(),
  };
}
