import { layoutViewFromMerged, type PlaceVisitBeat } from '../check/place-archetype.js';
import { mergePlaceFromTwinfile } from '../place/place-inherit.js';
import {
  readLayoutIndexDocument,
  resolveExamplesRoot,
  type LayoutIndexDocument,
  type LoadedTwinfile,
} from '@doppler-group/twinfile-core';

export type LayoutSummary = {
  spaces: { total: number; withParent: number };
  layoutIndex?: LayoutIndexDocument;
  visits: PlaceVisitBeat[];
};

/** Summarize place topology from merged compose (no full build). */
export function buildLayoutSummary(loaded: LoadedTwinfile): LayoutSummary {
  const examplesRoot = resolveExamplesRoot(loaded.root);
  const merged = mergePlaceFromTwinfile(loaded, examplesRoot ? { examplesRoot } : undefined);
  if (!merged.ok) {
    throw new Error(merged.errors.map((e) => e.message).join('; '));
  }
  const view = layoutViewFromMerged(merged.value as Record<string, unknown>);
  const withParent = view.spaces.filter(
    (row) => typeof row.parent === 'string' && String(row.parent).trim().length > 0,
  ).length;
  return {
    spaces: { total: view.spaces.length, withParent },
    layoutIndex: readLayoutIndexDocument(loaded),
    visits: view.visits,
  };
}

export function formatLayoutSummaryText(summary: LayoutSummary): string {
  const lines: string[] = [];
  lines.push(`spaces: ${summary.spaces.total} (${summary.spaces.withParent} with parent)`);
  if (summary.layoutIndex) {
    lines.push('layout_index:');
    const walk = (regions: LayoutIndexDocument['regions'], indent: string): void => {
      for (const region of regions) {
        lines.push(`${indent}- ${region.id}`);
        if (region.children?.length) walk(region.children, `${indent}  `);
      }
    };
    walk(summary.layoutIndex.regions, '  ');
  }
  if (summary.visits.length > 0) {
    lines.push('visits:');
    for (const visit of summary.visits) {
      lines.push(`  - ${visit.id} (${visit.space})`);
    }
  }
  return `${lines.join('\n')}\n`;
}