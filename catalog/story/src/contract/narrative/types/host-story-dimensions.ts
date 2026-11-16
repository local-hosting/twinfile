import type { DramaticBeatId } from './dramatic-beat.js';
import type { EpisodeArcV1 } from './episode-arc.js';

/**
 * Host create-body 5W+H — Story episode spine plus host overlays
 * (Character display name, fleet store, geo pin, engagement catalog).
 * Portable across Fieldwise / other hosts; not a Trustbase type.
 */

export type HostStoryDimensionWhoV1 = {
  characterId?: string;
  characterIds?: string[];
  displayName?: string;
  segmentId?: string;
};

export type HostStoryDimensionWhatV1 = {
  episodeId?: string;
  journeyId?: string;
  arcKind?: string;
  startStoreVisitJourney?: boolean;
};

/** Geo + fleet overlays on {@link StoryDimensionWhereV1}. */
export type HostStoryDimensionWhereV1 = {
  countryCode?: string;
  storeSlug?: string;
  /** Derived place slug from `placeRef` (legacy wire name `venueSlug`). */
  venueSlug?: string;
  /** Convenience alias of `primaryPlaceRef` for single-place create. */
  placeRef?: string;
  placeRefs?: string[];
  primaryPlaceRef?: string;
  spaceIds?: string[];
  place?: string;
  h3Cell?: string;
  state?: string;
  city?: string;
  country?: string;
  zip?: string;
  dma?: string;
  lat?: number;
  lon?: number;
};

export type HostStoryDimensionWhenV1 = {
  simulationEpochStart?: string;
  useFeedCalendar?: boolean;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  alignToWallCalendar?: boolean;
  storyArc?: EpisodeArcV1;
};

export type HostEngagementLevelId =
  | 'stranger'
  | 'explorer'
  | 'beginner'
  | 'regular'
  | 'champion'
  | 'rejoiner';

export type HostStoryDimensionWhyV1 = {
  jobIds?: string[];
  situation?: string;
  narrativeBeat?: string;
  engagementLevelId?: HostEngagementLevelId;
  intentIds?: string[];
  focusAreaId?: string;
  interestIds?: string[];
};

export type HostStoryDimensionHowV1 = {
  journeyPace?: string;
  dramaticBeatIds?: DramaticBeatId[];
  segmentPresetId?: string;
};

export type HostStoryCreateDimensionsV1 = {
  who: HostStoryDimensionWhoV1;
  what?: HostStoryDimensionWhatV1;
  where: HostStoryDimensionWhereV1;
  when?: HostStoryDimensionWhenV1;
  why?: HostStoryDimensionWhyV1;
  how?: HostStoryDimensionHowV1;
};
