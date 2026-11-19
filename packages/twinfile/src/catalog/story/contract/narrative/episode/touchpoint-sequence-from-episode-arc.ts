import type { EpisodeArcV1 } from '../types/episode-arc.js';

/** Objective touchpoint ids from a compiled `episodeArc`, when present. */
export function touchpointSequenceFromEpisodeArc(
  storyArc?: EpisodeArcV1,
): string[] | undefined {
  const ids = storyArc?.objectiveTouchpointIds;
  if (!ids?.length) {
    return undefined;
  }
  return [...ids];
}

/** @deprecated Prefer {@link touchpointSequenceFromEpisodeArc}. */
export const touchpointSequenceFromStoryArc = touchpointSequenceFromEpisodeArc;
