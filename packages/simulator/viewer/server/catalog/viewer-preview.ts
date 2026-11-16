import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import {
  twinfileDisplayName,
  twinfileRefId,
} from '@doppler-group/twinfile-core';
import { renderWorkbenchStoryHtml } from '../../render/lib/render-workbench-story.js';
import {
  buildViewerStoryVariationAsync,
  buildViewerTwinfilePage,
  defaultViewerStoryVariationId,
  listLensStoryTabs,
  listViewerStoryTabs,
  type ViewerStoryTab,
  type ViewerStoryVariation,
  type ViewerTwinfilePage,
} from './viewer-twinfile-page.js';
import { viewerTimeMetaFromBuild } from '../payloads/viewer-time.js';

export type ViewerPreviewMeta = {
  digest: string;
  refKey: string;
  /** Ref slug — manifest `id`. */
  id: string;
  name: string;
  kind: string;
  version: string;
};

export type ViewerPreviewPayload = ViewerPreviewMeta & {
  schema: 'twinfile.viewer.preview.v1';
  page: ViewerTwinfilePage;
};

export type ViewerPreviewIndexPayload = ViewerPreviewMeta & {
  schema: 'twinfile.viewer.preview.index.v1';
  variations: ViewerStoryTab[];
  defaultVariationId: string;
  sessionClock?: {
    timezone: string;
    durationS: number;
    stepS: number;
    tickCount: number;
    endsAt: string;
    playbackSpeed?: number;
  };
};

export type ViewerPreviewVariationPayload = ViewerPreviewMeta & {
  schema: 'twinfile.viewer.preview.variation.v1';
  variation: ViewerStoryVariation;
  html: string;
};

function previewMeta(result: BuildTwinfileResult): ViewerPreviewMeta {
  const twinfile = result.loaded.twinfile;
  const field = (key: string): string => {
    const value = twinfile[key];
    return typeof value === 'string' ? value : String(value ?? '');
  };
  const place = result.data as Record<string, unknown> | undefined;
  return {
    digest: result.digest,
    refKey: result.refKey,
    id: twinfileRefId(twinfile) ?? field('id'),
    name: twinfileDisplayName(twinfile, place),
    kind: field('kind'),
    version: field('version'),
  };
}

/** Tab index after build — no card/layout/disclosure bodies. */
export function buildViewerPreviewIndex(
  spatial: BuildTwinfileResult,
  session?: BuildTwinfileResult,
): ViewerPreviewIndexPayload {
  const spatialTabs = listViewerStoryTabs(spatial);
  const sessionBuild = session ?? spatial;
  const lensTabs =
    session && session.digest !== spatial.digest ? listLensStoryTabs(sessionBuild) : [];
  const variations = [...spatialTabs, ...lensTabs];
  const time = viewerTimeMetaFromBuild(sessionBuild);
  return {
    schema: 'twinfile.viewer.preview.index.v1',
    ...previewMeta(spatial),
    variations,
    defaultVariationId: defaultViewerStoryVariationId(variations),
    ...(time
      ? {
          sessionClock: {
            timezone: time.timezone,
            durationS: time.durationS,
            stepS: time.stepS,
            tickCount: time.tickCount,
            endsAt: time.endsAt,
            playbackSpeed: 1,
          },
        }
      : {}),
  };
}

/** One evaluated view (lazy-friendly for `/api/preview`). */
export async function buildViewerPreviewVariation(
  spatial: BuildTwinfileResult,
  variationId: string,
  session?: BuildTwinfileResult,
): Promise<ViewerPreviewVariationPayload | { error: string }> {
  const sessionBuild = variationId === 'run' ? (session ?? spatial) : spatial;
  const variation = await buildViewerStoryVariationAsync(sessionBuild, variationId);
  if (!variation) {
    return { error: `unknown or empty variation: ${variationId}` };
  }
  return {
    schema: 'twinfile.viewer.preview.variation.v1',
    ...previewMeta(spatial),
    variation,
    html: renderWorkbenchStoryHtml(variation, 'place'),
  };
}

/** Full page (all variations). Legacy; prefer index + variation requests. */
export function buildViewerPreview(result: BuildTwinfileResult): ViewerPreviewPayload {
  const page = buildViewerTwinfilePage(result);
  const meta = previewMeta(result);
  return {
    schema: 'twinfile.viewer.preview.v1',
    ...meta,
    page,
  };
}
