import { extractJourneyTouchpointSequence, type Journey } from '@local-hosting/twinfile-character/persona';

import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { Story } from '../types/story-narrative.js';
import { deriveEpisodeTimingFromJobs } from '../episode/derive-episode-timing-from-jobs.js';
import { journeyHasCalendarSpan } from './journey-touchpoint-binding.js';

export type StoryEpisodePresentationMode = 'session' | 'horizon';

export type StoryEpisodePresentationV1 = {
  mode: StoryEpisodePresentationMode;
  scriptTouchpointIds: readonly string[];
  /** Human label for director copy. */
  timeframeLabel: string;
  journeyGoal?: string;
  journeyLabel?: string;
};

export function resolveStoryEpisodePresentation(input: {
  journey?: Journey;
  story?: Story;
  arc?: EpisodeArcV1;
}): StoryEpisodePresentationV1 {
  const arc = input.arc ?? input.story?.episodeArc;
  const fromJourney = input.journey ? extractJourneyTouchpointSequence(input.journey) : [];
  const fromArc = (arc?.objectiveTouchpointIds ?? []).map((id) => id.trim()).filter(Boolean);
  const scriptTouchpointIds = fromJourney.length > 0 ? fromJourney : fromArc;

  const derived = deriveEpisodeTimingFromJobs({
    journey: input.journey,
    touchpointIds: scriptTouchpointIds,
  });
  const horizonDays =
    arc?.planningHorizonDays ??
    input.story?.binding.planningHorizonDays ??
    derived.planningHorizonDays;
  const hasCalendar = journeyHasCalendarSpan(input.journey);
  const sessionShapedJourney =
    derived.session ||
    (Boolean(input.journey) &&
      !hasCalendar &&
      scriptTouchpointIds.length > 0 &&
      scriptTouchpointIds.length <= 12);

  const mode: StoryEpisodePresentationMode = sessionShapedJourney ? 'session' : 'horizon';

  const timeframeLabel =
    mode === 'session'
      ? 'single session (one continuous day on set)'
      : `${horizonDays}-day planning horizon`;

  return {
    mode,
    scriptTouchpointIds,
    timeframeLabel,
    journeyGoal: input.journey?.journeyGoal?.trim() || input.journey?.description?.trim(),
    journeyLabel: input.journey?.label?.trim(),
  };
}
