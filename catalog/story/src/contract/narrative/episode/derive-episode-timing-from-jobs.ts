import { extractJourneyTouchpointSequence, type Journey } from '@doppler-group/twinfile-character/persona';
import { collectJobIdsFromJourney, journeyHasCalendarSpan } from '../brief/journey-touchpoint-binding.js';
import {
  DEFAULT_PLANNING_HORIZON_DAYS,
  MIN_PLANNING_HORIZON_DAYS,
} from '../types/episode-arc.js';

export type DerivedEpisodeTimingV1 = {
  planningHorizonDays: number;
  visitDayIndex: number;
  /** Same-day script spine (commute, single visit flow). */
  session: boolean;
};

function daysPerJobForPace(journeyPace?: string): number {
  const pace = journeyPace?.trim().toLowerCase();
  if (pace === 'fast') return 3;
  if (pace === 'slow') return 10;
  return 7;
}

function denouementReserveDays(journeyPace?: string): number {
  const pace = journeyPace?.trim().toLowerCase();
  if (pace === 'fast') return 2;
  if (pace === 'slow') return 10;
  return 5;
}

/**
 * Episode length from journey touchpoints + distinct JTBD jobs (not a fixed 56-day retail default).
 */
export function deriveEpisodeTimingFromJobs(input: {
  journey?: Journey;
  touchpointIds?: readonly string[];
  journeyPace?: string;
  rankedJobCount?: number;
}): DerivedEpisodeTimingV1 {
  const fromJourney = input.journey ? extractJourneyTouchpointSequence(input.journey) : [];
  const touchpointIds = (input.touchpointIds?.length ? input.touchpointIds : fromJourney)
    .map((id) => id.trim())
    .filter(Boolean);
  const jobIds = collectJobIdsFromJourney(input.journey);
  const jobCount = Math.max(
    input.rankedJobCount ?? 0,
    jobIds.length,
    touchpointIds.length > 0 ? 1 : 0,
  );

  const hasCalendar = journeyHasCalendarSpan(input.journey);
  const sessionShaped =
    Boolean(input.journey) &&
    !hasCalendar &&
    touchpointIds.length > 0 &&
    touchpointIds.length <= 12 &&
    jobCount <= 6;

  if (sessionShaped) {
    return {
      planningHorizonDays: 1,
      visitDayIndex: 0,
      session: true,
    };
  }

  const daysPerJob = daysPerJobForPace(input.journeyPace);
  const reserve = denouementReserveDays(input.journeyPace);
  const pursuitSpan = Math.max(jobCount, Math.ceil(touchpointIds.length / 2)) * daysPerJob;
  const rawHorizon = pursuitSpan + reserve + 2;
  const planningHorizonDays = Math.min(
    DEFAULT_PLANNING_HORIZON_DAYS,
    Math.max(MIN_PLANNING_HORIZON_DAYS, rawHorizon),
  );
  const visitDayIndex = Math.min(
    planningHorizonDays - reserve - 1,
    Math.max(1, Math.floor(planningHorizonDays * 0.45)),
  );

  return {
    planningHorizonDays,
    visitDayIndex,
    session: false,
  };
}
