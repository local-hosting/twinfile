import type { DtprDisclosureRow, ProcessorsResourceV1, TwinfileSummaryV1 } from '@local-hosting/twinfile';

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

export type WorkbenchBuildLayerRow = {
  index: number;
  ref: string;
  kind: string;
  chain: string;
  label?: string;
  imageLayerCount?: number;
  detail?: WorkbenchBuildLayerRow[];
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
