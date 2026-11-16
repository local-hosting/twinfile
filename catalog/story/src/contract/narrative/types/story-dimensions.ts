import type { EpisodeArcV1 } from './episode-arc.js';
import type { DramaticBeatId } from './dramatic-beat.js';

/** SAM-owned slice of “who” — PCM ref + cast; display names come from PCM materialization on the host. */
export type SamStoryDimensionWhoV1 = {
  pcmId: string;
  /** PCMs appearing in `scenes` (includes focal `pcmId` when present in cast). */
  characterIds: string[];
};

export type SamStoryDimensionWhatV1 = {
  samEpisodeId: string;
  journeyId: string;
  arcKind?: string;
};

export type SamStoryDimensionWhereV1 = {
  /** Distinct place mounts used across scenes (`venue:*`). */
  venueKeys: string[];
  /** First scene venue unless overridden by host fleet binding. */
  primaryVenueKey?: string;
  spaceIds?: string[];
};

export type SamStoryDimensionWhenV1 = {
  simulationEpochStart: string;
  planningHorizonDays: number;
  visitDayIndex: number;
  storyArc?: EpisodeArcV1;
};

/** Motivation spine from scenes (needs/jobs); engagement levels remain host catalog policy. */
export type SamStoryDimensionWhyV1 = {
  jobIds?: string[];
  situation?: string;
  narrativeBeat?: string;
};

export type SamStoryDimensionHowV1 = {
  journeyPace?: string;
  dramaticBeatIds?: DramaticBeatId[];
};

/**
 * Portable 5W+H contract projected from a compiled SAM episode.
 * Hosts merge PCM instance overlays on `who` and fleet/geo on `where`.
 */
export type SamStoryDimensionsV1 = {
  specVersion: '1.0';
  who: SamStoryDimensionWhoV1;
  what: SamStoryDimensionWhatV1;
  where: SamStoryDimensionWhereV1;
  when: SamStoryDimensionWhenV1;
  why?: SamStoryDimensionWhyV1;
  how?: SamStoryDimensionHowV1;
};
