import type { EpisodeActivityKind } from '../types/episode-activity.js';

/** Minimal activity row on `when.timeline` (SAM-owned parser). */
export type StoryTimelineActivityWire = {
  id?: string;
  kind: EpisodeActivityKind | string;
  startTime: number;
  endTime: number;
  touchpointId?: string;
  journeyPhaseId?: string;
  label?: string;
  jobId?: string;
  placeOpportunityId?: string;
};

export type StoryTimelineDayWire = {
  dayIndex: number;
  schedule?: {
    activities?: readonly StoryTimelineActivityWire[];
  };
};

export type StoryTimelineHostWire = Record<string, StoryTimelineDayWire>;
