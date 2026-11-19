import {
  DEFAULT_PLANNING_HORIZON_DAYS,
  MIN_PLANNING_HORIZON_DAYS,
} from '../types/episode-arc.js';
import {
  DEFAULT_EPISODE_TIMING_VARIATION,
  resolveEpisodeTimingVariation,
  type EpisodeTimingVariation,
} from '../types/episode-timing-variation.js';

export type { EpisodeTimingVariation } from '../types/episode-timing-variation.js';
export {
  DEFAULT_EPISODE_TIMING_VARIATION,
  resolveEpisodeTimingVariation,
} from '../types/episode-timing-variation.js';

export function resolvePlanningHorizonDays(
  value?: number,
  options?: { sessionEpisode?: boolean },
): number {
  if (value == null || !Number.isFinite(value)) {
    return options?.sessionEpisode ? 1 : DEFAULT_PLANNING_HORIZON_DAYS;
  }
  const days = Math.round(value);
  const min = options?.sessionEpisode ? 1 : MIN_PLANNING_HORIZON_DAYS;
  return Math.min(DEFAULT_PLANNING_HORIZON_DAYS, Math.max(min, days));
}

export function resolveRandomPlanningHorizonDays(
  random: () => number = Math.random,
  variation: EpisodeTimingVariation = DEFAULT_EPISODE_TIMING_VARIATION,
): number {
  const min = variation.minPlanningHorizonDays;
  const max = variation.maxPlanningHorizonDays;
  const span = max - min + 1;
  return min + Math.floor(random() * span);
}

export function resolveVisitDayIndex(input: {
  visitDayIndex?: number;
  journeyPace?: string;
  planningHorizonDays: number;
  random?: () => number;
  variation?: Partial<EpisodeTimingVariation>;
}): number {
  const variation = resolveEpisodeTimingVariation(input.variation);
  const maxVisit = Math.max(
    1,
    input.planningHorizonDays - variation.postVisitReserveDays - 1,
  );

  if (input.visitDayIndex != null) {
    return Math.min(Math.max(1, input.visitDayIndex), maxVisit);
  }

  const pace = input.journeyPace?.trim().toLowerCase();
  if (pace === 'fast') {
    return Math.min(variation.fastPaceVisitDayCap, maxVisit);
  }
  if (pace === 'slow') {
    return Math.min(variation.slowPaceVisitDayCap, maxVisit);
  }

  const random = input.random ?? Math.random;
  const minVisit = Math.min(variation.randomVisitMinDay, maxVisit);
  const span = maxVisit - minVisit + 1;
  return minVisit + Math.floor(random() * span);
}
