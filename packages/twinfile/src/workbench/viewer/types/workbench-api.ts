import type { DtprDisclosureRow, ProcessorsResourceV1, TwinfileSummaryV1, TwinfileUseMode } from '@local-hosting/twinfile';
import type { SessionClockBusRecord, TimelineSample, WorldSessionEdge } from '@local-hosting/twinfile/simulator';

import type { WorkbenchContextPulseResponse } from './workbench-environment.js';

export type LayoutOverviewSpace = {
  id: string;
  name?: string;
  level?: string;
  exposure?: string;
  kind?: string;
  parent?: string;
  roles?: string[];
};

export type LayoutOverviewOpening = {
  id: string;
  kind?: string;
  connects: string[];
  state?: string;
};

export type LayoutOverviewRoute = {
  id: string;
  name?: string;
  from: string;
  to: string;
  length_m?: number;
  kind?: string;
};

export type LayoutOverviewLevel = {
  id: string;
  name?: string;
};

export type LayoutOverview = {
  placeName?: string;
  layoutArchetype?: string;
  geo?: { lat: number; lon: number };
  levels: LayoutOverviewLevel[];
  spaces: LayoutOverviewSpace[];
  openings: LayoutOverviewOpening[];
  routes: LayoutOverviewRoute[];
};

export type ViewerBuildLayerRow = {
  index: number;
  ref: string;
  kind: string;
  chain: string;
  label?: string;
  imageLayerCount?: number;
  detail?: ViewerBuildLayerRow[];
};

export type ViewerBuildHistoryPayload = {
  recipe: import('@local-hosting/twinfile').TwinfileManifestRecipe;
  layers: ViewerBuildLayerRow[];
  detailLayers: ViewerBuildLayerRow[];
};

export type WorkbenchCatalogEntry = {
  id: string;
  label: string;
  group: string;
  kind: string;
  /** Catalog id of the site/building that copies this nested stage. */
  parent?: string;
  /** Merged place space id when `kind` is `region` (topology drill-down). */
  region?: string;
  /** Host place Twinfile (examples folder slug) — scope for runs / events / tree. */
  hostPlaceCatalogId?: string;
  /** Shared events linked from this host's scenario runs. */
  hostPlaceCatalogIds?: string[];
};

export type WorkbenchStoryTab = {
  id: string;
  label: string;
  kind: 'summary' | 'layout' | 'disclosures' | 'layers' | 'processors' | 'run' | 'twinfile';
};

/** Programme run (`kind: scenario`) — not the place card. */
export type RunOverview = {
  name: string;
  id: string;
  version: string;
  question?: string;
  runner?: string;
  clock?: unknown;
  resolvedArgs?: Record<string, unknown>;
};

/** Story args from `/api/preview` — editor canvas renders these (Storybook-style). */
export type WorkbenchBuildLayerRow = ViewerBuildLayerRow;

export type WorkbenchStoryVariation =
  | { id: string; label: string; kind: 'summary'; summary: TwinfileSummaryV1 }
  | { id: string; label: string; kind: 'twinfile'; filename: string; text: string }
  | { id: string; label: string; kind: 'layout'; layout: LayoutOverview }
  | { id: string; label: string; kind: 'disclosures'; disclosures: DtprDisclosureRow[] }
  | {
      id: string;
      label: string;
      kind: 'layers';
      recipe: import('@local-hosting/twinfile').TwinfileManifestRecipe;
      layers: WorkbenchBuildLayerRow[];
      detailLayers: WorkbenchBuildLayerRow[];
    }
  | { id: string; label: string; kind: 'processors'; processors: ProcessorsResourceV1 }
  | { id: string; label: string; kind: 'run'; run: RunOverview };

export type WorkbenchManifestPage = {
  schema: 'twinfile.viewer.twinfile-page.v1';
  variations: WorkbenchStoryVariation[];
  defaultVariationId: string;
  docsMarkdown: string;
};

export type WorkbenchTwinfilePayload = {
  schema: 'twinfile.viewer.twinfile.v1' | 'twinfile.viewer.source.v1';
  unitId?: string | null;
  manifest?: string;
  /** Ref slug — manifest `id`. */
  id: string;
  name: string;
  kind: string;
  version: string;
  text: string;
  error?: string;
};

export type WorkbenchPreviewMeta = {
  digest: string;
  refKey: string;
  id: string;
  name: string;
  kind: string;
  version: string;
};

/** Scenario `clock:` metadata for workbench session transport (play / scrub / local time). */
export type WorkbenchSessionClockMeta = {
  timezone: string;
  durationS: number;
  stepS: number;
  tickCount: number;
  endsAt: string;
  playbackSpeed?: number;
};

export type WorkbenchSessionSample = {
  playheadT: number;
  localAt: string;
  mode: TimelineSample['mode'];
  activeIds: string[];
  occupancySpaceIds: string[];
  occupancyCount: number;
  visitBeatCount: number;
  noteIndex?: number;
  lastEvent?: string;
  bus?: { messageCount: number; wires: string[] };
};

export type WorkbenchSessionAdvanceResponse = {
  schema: 'twinfile.viewer.session.advance.v1';
  playheadT: number;
  localAt: string;
  at: string;
  sample: TimelineSample;
  edges: WorldSessionEdge[];
  clockEvents?: SessionClockBusRecord[];
  pulse?: WorkbenchContextPulseResponse;
};

export type WorkbenchPreviewIndexPayload = WorkbenchPreviewMeta & {
  schema: 'twinfile.viewer.preview.index.v1';
  unitId?: string | null;
  variations: WorkbenchStoryTab[];
  defaultVariationId: string;
  sessionClock?: WorkbenchSessionClockMeta;
  error?: string;
  errors?: Array<{ message?: string }>;
};

export type WorkbenchPreviewVariationPayload = WorkbenchPreviewMeta & {
  schema: 'twinfile.viewer.preview.variation.v1';
  unitId?: string | null;
  variation: WorkbenchStoryVariation;
  /** Host-rendered canvas HTML (`renderWorkbenchStoryHtml`). */
  html: string;
  error?: string;
};

/** Legacy full payload (`?view=full`). */
export type WorkbenchPreviewPayload = WorkbenchPreviewMeta & {
  schema: 'twinfile.viewer.preview.v1';
  unitId?: string | null;
  page: WorkbenchManifestPage;
  error?: string;
  errors?: Array<{ message?: string }>;
};

export type WorkbenchCatalogPayload = {
  entries: WorkbenchCatalogEntry[];
  defaultEntryId: string | null;
};
