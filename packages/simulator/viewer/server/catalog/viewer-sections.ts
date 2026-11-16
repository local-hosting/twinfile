import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import {
  listDtprDisclosures,
} from '@doppler-group/twinfile-core';

import { buildViewerSummaryPayload, viewerSummarySectionIds } from '../payloads/viewer-summary.js';
import { buildLayoutOverview } from '../payloads/viewer-layout.js';
import { buildViewerProcessorsPayload } from '../payloads/viewer-processors.js';
import { viewerTimeMetaFromBuild, type ViewerTimeMeta } from '../payloads/viewer-time.js';
import { buildViewerTwinfilePage, type ViewerTwinfilePage } from './viewer-twinfile-page.js';

export type ViewerSectionMeta = {
  id: string;
  label: string;
  group: 'twinfile' | 'summaries' | 'image' | 'place' | 'extras';
  kind: 'document' | 'collection' | 'list' | 'layout' | 'disclosures' | 'time' | 'summary' | 'processors';
  count?: number;
};

export type ViewerCatalog = {
  digest: string;
  refKey: string;
  name: string;
  kind: string;
  version: string;
  sections: ViewerSectionMeta[];
  /** Present when the unit declares a scenario `clock` and the place has a timezone. */
  time?: ViewerTimeMeta;
  /** Component-framework canvas (variations per twinfile). */
  page?: ViewerTwinfilePage;
};

const PLACE_SECTION_PREFIX = 'place.';

function twinfileField(twinfile: Record<string, unknown>, key: string): string {
  const value = twinfile[key];
  return typeof value === 'string' ? value : String(value ?? '');
}

const VIEWER_GROUP_ORDER: ViewerSectionMeta['group'][] = ['twinfile', 'summaries', 'image', 'place', 'extras'];

function sortViewerSections(sections: ViewerSectionMeta[]): ViewerSectionMeta[] {
  return [...sections].sort((a, b) => {
    const groupDelta =
      VIEWER_GROUP_ORDER.indexOf(a.group) - VIEWER_GROUP_ORDER.indexOf(b.group);
    if (groupDelta !== 0) {
      return groupDelta;
    }
    if (a.id === 'layout.overview') {
      return -1;
    }
    if (b.id === 'layout.overview') {
      return 1;
    }
    if (a.group === 'summaries' && b.group === 'summaries') {
      if (a.id === 'summary.head') {
        return -1;
      }
      if (b.id === 'summary.head') {
        return 1;
      }
    }
    return a.label.localeCompare(b.label);
  });
}

function placeCollectionKey(sectionId: string): string | undefined {
  if (sectionId.startsWith(PLACE_SECTION_PREFIX)) {
    return sectionId.slice(PLACE_SECTION_PREFIX.length);
  }
  return undefined;
}

export function buildViewerCatalog(result: BuildTwinfileResult): ViewerCatalog {
  const { loaded: unit, data: mergedPlace, refKey } = result;
  const sections: ViewerSectionMeta[] = [
    { id: 'layout.overview', label: 'Layout', group: 'place', kind: 'layout' },
    {
      id: 'manifest',
      label: unit.twinfilePath.split(/[/\\]/).pop() ?? 'twin head',
      group: 'twinfile',
      kind: 'document',
    },
    { id: 'layers', label: 'Build history', group: 'twinfile', kind: 'list' },
    { id: 'meta', label: 'Image meta', group: 'image', kind: 'document' },
  ];

  for (const row of viewerSummarySectionIds(result)) {
    sections.push({
      id: row.id,
      label: row.label,
      group: 'summaries',
      kind: 'summary',
    });
  }

  for (const key of Object.keys(mergedPlace).sort()) {
    const value = mergedPlace[key];
    if (Array.isArray(value)) {
      sections.push({
        id: `${PLACE_SECTION_PREFIX}${key}`,
        label: key,
        group: 'place',
        kind: 'collection',
        count: value.length,
      });
      continue;
    }
    if (value && typeof value === 'object') {
      sections.push({
        id: `${PLACE_SECTION_PREFIX}${key}`,
        label: key,
        group: 'place',
        kind: 'document',
      });
    }
  }

  const timeMeta = viewerTimeMetaFromBuild(result);
  if (timeMeta) {
    sections.push({
      id: 'time.scrub',
      label: 'Time',
      group: 'extras',
      kind: 'time',
    });
  }

  if (buildViewerProcessorsPayload(result)) {
    const count = (result.meta as { processors?: { processorCount?: number } } | undefined)?.processors
      ?.processorCount;
    sections.push({
      id: 'processors.patch',
      label: 'Patch graph',
      group: 'extras',
      kind: 'processors',
      ...(typeof count === 'number' ? { count } : {}),
    });
  }

  const disclosureCount = listDtprDisclosures(mergedPlace).length;
  if (disclosureCount > 0) {
    sections.push({
      id: 'disclosures',
      label: 'DTPR disclosures',
      group: 'extras',
      kind: 'disclosures',
      count: disclosureCount,
    });
  }

  return {
    digest: result.digest,
    refKey,
    name: twinfileField(unit.twinfile, 'name'),
    kind: twinfileField(unit.twinfile, 'kind'),
    version: twinfileField(unit.twinfile, 'version'),
    sections: sortViewerSections(sections),
    page: buildViewerTwinfilePage(result),
    ...(timeMeta ? { time: timeMeta } : {}),
  };
}

export function resolveViewerSection(result: BuildTwinfileResult, sectionId: string): unknown {
  const { loaded: unit, data: mergedPlace, meta, layers } = result;
  switch (sectionId) {
    case 'layout.overview':
      return buildLayoutOverview(mergedPlace);
    case 'disclosures':
      return listDtprDisclosures(mergedPlace);
    case 'manifest':
      return unit.twinfile;
    case 'meta':
      return meta;
    case 'layers':
      return layers.map(({ ref, kind, chain, content }) => ({ ref, kind, chain, content }));
    case 'place.eventBindings':
      return (mergedPlace as { eventBindings?: Record<string, unknown> }).eventBindings ?? {};
    case 'time.scrub':
      return viewerTimeMetaFromBuild(result) ?? null;
    case 'processors.patch':
      return buildViewerProcessorsPayload(result);
    default: {
      if (
        sectionId === 'summary.head' ||
        sectionId.startsWith('summary.patch.') ||
        sectionId === 'card.head' ||
        sectionId.startsWith('card.patch.')
      ) {
        return buildViewerSummaryPayload(result, sectionId);
      }
      const key = placeCollectionKey(sectionId);
      if (!key || !(key in mergedPlace)) {
        return undefined;
      }
      return mergedPlace[key];
    }
  }
}

export async function resolveViewerSectionAsync(
  result: BuildTwinfileResult,
  sectionId: string,
): Promise<unknown> {
  return resolveViewerSection(result, sectionId);
}
