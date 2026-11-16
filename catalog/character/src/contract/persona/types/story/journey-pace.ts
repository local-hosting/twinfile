/** Episode visit-day pacing — consumed by `@local-hosting/twinfile-story/sam` `resolveVisitDayIndex`. */
export const JOURNEY_PACE_IDS = ['slow', 'medium', 'fast'] as const;

export type JourneyPaceId = (typeof JOURNEY_PACE_IDS)[number];
