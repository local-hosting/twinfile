/** Episode visit-day pacing — consumed by `@doppler-group/twinfile-story/narrative` `resolveVisitDayIndex`. */
export const JOURNEY_PACE_IDS = ['slow', 'medium', 'fast'] as const;

export type JourneyPaceId = (typeof JOURNEY_PACE_IDS)[number];
