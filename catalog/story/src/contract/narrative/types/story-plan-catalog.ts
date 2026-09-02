import type { StoryCatalogMenuV1 } from './story-catalog-menu.js';

export type StoryPlanFleetPlaceSnapshotV1 = {
  slug: string;
  name?: string;
  lat?: number;
  lon?: number;
  h3Cell?: string;
};

export type StoryPlanSegmentSnapshotV1 = {
  id: string;
  label?: string;
  topic?: string;
  needsSummary?: string;
  journeyPace?: string;
  intentIds: string[];
};

/** Segment objective row in the planning catalog snapshot. */
export type StoryPlanSegmentObjectiveV1 = {
  intentId?: string;
  validLevelIds?: readonly string[];
};

export type StoryPlanCatalogSnapshotV1 = {
  segments: StoryPlanSegmentSnapshotV1[];
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  characterIds: string[];
  episodeIds: string[];
  storyMenu?: StoryCatalogMenuV1;
  jobIds: string[];
  fleetPlaces: StoryPlanFleetPlaceSnapshotV1[];
  touchpointCount: number;
  hubTouchpointId?: string;
  touchpointIdsSample: string[];
};
