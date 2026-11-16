import {
  DEFAULT_PLANNING_HORIZON_DAYS,
  MIN_PLANNING_HORIZON_DAYS,
} from './episode-arc.js';

/** Accepted bounds and pacing rules when visit day / horizon are not fixed on the SAM binding. */
export type EpisodeTimingVariation = {
  specVersion: '1.0';
  minPlanningHorizonDays: number;
  maxPlanningHorizonDays: number;
  postVisitReserveDays: number;
  /** Random visit window lower bound (inclusive day index). */
  randomVisitMinDay: number;
  /** `journeyPace: fast` caps visit day at this index. */
  fastPaceVisitDayCap: number;
  /** `journeyPace: slow` caps visit day at this index. */
  slowPaceVisitDayCap: number;
};

export const DEFAULT_EPISODE_TIMING_VARIATION: EpisodeTimingVariation = {
  specVersion: '1.0',
  minPlanningHorizonDays: MIN_PLANNING_HORIZON_DAYS,
  maxPlanningHorizonDays: DEFAULT_PLANNING_HORIZON_DAYS,
  postVisitReserveDays: 7,
  randomVisitMinDay: 14,
  fastPaceVisitDayCap: 21,
  slowPaceVisitDayCap: 35,
};

export function resolveEpisodeTimingVariation(
  ...overrides: Array<Partial<EpisodeTimingVariation> | undefined>
): EpisodeTimingVariation {
  return {
    ...DEFAULT_EPISODE_TIMING_VARIATION,
    ...overrides.reduce(
      (acc, row) => (row ? { ...acc, ...row } : acc),
      {} as Partial<EpisodeTimingVariation>,
    ),
  };
}
