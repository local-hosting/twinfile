import type { SamStoryCatalogMenuV1 } from './story-catalog-menu.js';

export type SamStoryPlanFleetVenueSnapshotV1 = {
  slug: string;
  name?: string;
  lat?: number;
  lon?: number;
  h3Cell?: string;
};

export type SamStoryPlanSegmentSnapshotV1 = {
  id: string;
  label?: string;
  topic?: string;
  needsSummary?: string;
  journeyPace?: string;
  intentIds: string[];
};

/** Org segment objective row (AXM planning catalog). */
export type SamStoryPlanSegmentObjectiveV1 = {
  intentId?: string;
  validLevelIds?: readonly string[];
};

export type SamStoryPlanCatalogSnapshotV1 = {
  segments: SamStoryPlanSegmentSnapshotV1[];
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  pcmIds: string[];
  samEpisodeIds: string[];
  storyMenu?: SamStoryCatalogMenuV1;
  jobIds: string[];
  fleetVenues: SamStoryPlanFleetVenueSnapshotV1[];
  touchpointCount: number;
  hubTouchpointId?: string;
  touchpointIdsSample: string[];
  axmMenu?: SamStoryCatalogMenuV1;
};
