import type { EpisodePhaseId } from './episode-arc.js';

/**
 * Activity kinds aligned with doppler `ActivityKind` — simulation hosts map 1:1 when patching
 * persona calendars.
 */
export type EpisodeActivityKind =
  | 'sleeping'
  | 'at_home_morning'
  | 'at_home_evening'
  | 'commute'
  | 'lunch_break'
  | 'dwell'
  | 'transaction'
  | 'service'
  | 'rest';

/** One scheduled block on a simulation day — doppler `ActivityBlock` compatible shape. */
export type EpisodeScheduledActivity = {
  id: string;
  kind: EpisodeActivityKind;
  startTime: number;
  endTime: number;
  touchpointId?: string;
  /** Episode band (`pre_visit` | `on_site` | `post_visit`) for this story touchpoint. */
  journeyPhaseId?: EpisodePhaseId;
  jobId?: string;
  label?: string;
  /** Place catalog id — doppler `placeOpportunityId` / fleet slug host mapping. */
  placeOpportunityId?: string;
  placeRef?: string;
  spaceId?: string;
  sceneId?: string;
};

export type EpisodeActivityDay = {
  dayIndex: number;
  isoDate: string;
  activities: readonly EpisodeScheduledActivity[];
};

/** Full horizon of story-patched activities — output of {@link buildEpisodeActivityCalendar}. */
export type EpisodeActivityCalendar = {
  subjectId: string;
  simulationEpochStart: string;
  planningHorizonDays: number;
  days: readonly EpisodeActivityDay[];
};
