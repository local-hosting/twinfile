import type { EpisodeArcV1 } from './episode-arc.js';
import type { DramaticBeatId } from './dramatic-beat.js';

/** Story-owned slice of “who” — Character ref + cast; display names come from Character materialization on the host. */
export type StoryDimensionWhoV1 = {
  characterId: string;
  /** Characters appearing in `scenes` (includes focal `characterId` when present in cast). */
  characterIds: string[];
};

export type StoryDimensionWhatV1 = {
  /** Mounted Story twin id — journey spine lives on the Story document (`binding.journeyId`), not duplicated here. */
  storyId: string;
  arcKind?: string;
};

export type StoryDimensionWhereV1 = {
  /** Distinct place mounts used across scenes (`place:*`). */
  placeRefs: string[];
  /** First scene place unless overridden by host fleet binding. */
  primaryPlaceRef?: string;
  spaceIds?: string[];
};

export type StoryDimensionWhenV1 = {
  simulationEpochStart: string;
  planningHorizonDays: number;
  visitDayIndex: number;
  storyArc?: EpisodeArcV1;
};

/** Motivation spine from scenes (needs/jobs); engagement levels remain host catalog policy. */
export type StoryDimensionWhyV1 = {
  jobIds?: string[];
  context?: string;
  narrativeBeat?: string;
};

export type StoryDimensionHowV1 = {
  journeyPace?: string;
  dramaticBeatIds?: DramaticBeatId[];
};

/**
 * Portable 5W+H contract projected from a compiled Story episode.
 * Hosts merge Character instance overlays on `who` and fleet/geo on `where`.
 */
export type StoryDimensionsV1 = {
  specVersion: '1.0';
  who: StoryDimensionWhoV1;
  what: StoryDimensionWhatV1;
  where: StoryDimensionWhereV1;
  when: StoryDimensionWhenV1;
  why?: StoryDimensionWhyV1;
  how?: StoryDimensionHowV1;
};
