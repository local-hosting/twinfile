/** Pre / on-site / post bands for a compiled story episode on the persona calendar. */
export type EpisodePhaseId = 'pre_visit' | 'on_site' | 'post_visit';

export type EpisodeTouchpointScheduleEntry = {
  dayIndex: number;
  hour: number;
  touchpointId: string;
  phase: EpisodePhaseId;
  /** Storyboard scene when compiled from SAM `scenes`. */
  sceneId?: string;
  /** Place setting for this beat (scene `placeRef` / mounted place). */
  placeRef?: string;
  spaceId?: string;
  visitMomentId?: string;
  characterIds?: readonly string[];
};

/**
 * Compiled episode calendar — host wire shape (`StoryEpisodeArcV1`).
 * Produced from a validated {@link import('@local-hosting/twinfile-character/pcm').Journey} plus touchpoint index.
 */
export type EpisodeArcV1 = {
  version: 1;
  /** Wall-aligned simulation epoch (day 0) — ISO date. */
  simulationEpochStart: string;
  planningHorizonDays: number;
  visitDayIndex: number;
  /** Touchpoint order derived from the journey (phase and moment walk). */
  objectiveTouchpointIds: readonly string[];
  phases: {
    pre_visit: { startDayIndex: number; endDayIndex: number };
    on_site: { dayIndex: number };
    post_visit: { startDayIndex: number; endDayIndex: number };
  };
  touchpointSchedule: readonly EpisodeTouchpointScheduleEntry[];
};

/** Minimum retail episode length — six weeks of pre / visit / post touchpoints. */
export const MIN_PLANNING_HORIZON_DAYS = 42;

/** Default story episode length — eight weeks. */
export const DEFAULT_PLANNING_HORIZON_DAYS = 56;
