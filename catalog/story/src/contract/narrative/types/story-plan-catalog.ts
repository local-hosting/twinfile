import type { StoryCatalogMenuV1 } from './story-catalog-menu.js';

export type SamStoryPlanFleetPlaceSnapshotV1 = {
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
  characterIds: string[];
  episodeIds: string[];
  storyMenu?: StoryCatalogMenuV1;
  jobIds: string[];
  fleetPlaces: SamStoryPlanFleetPlaceSnapshotV1[];
  touchpointCount: number;
  hubTouchpointId?: string;
  touchpointIdsSample: string[];
  axmMenu?: StoryCatalogMenuV1;
};
