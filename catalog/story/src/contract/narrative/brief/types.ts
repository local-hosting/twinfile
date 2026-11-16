import type { EpisodeArcV1 } from '../types/episode-arc.js';

/** One titled group of bullet highlights (MCP describe tools). */
export type BriefSectionV1 = {
  title: string;
  bullets: readonly string[];
};

/** Structured brief before markdown rendering. */
export type BriefV1 = {
  headline: string;
  sections: readonly BriefSectionV1[];
};

export type StoryBriefWhoV1 = {
  segmentId?: string;
  pcmId?: string;
  displayName?: string;
};

export type StoryBriefWhatV1 = {
  samEpisodeId?: string;
  startStoreVisitJourney?: boolean;
};

export type StoryBriefWhereV1 = {
  storeSlug?: string;
  placeSlug?: string;
  placeRef?: string;
  lat?: number;
  lon?: number;
  h3Cell?: string;
  zip?: string;
  dma?: string;
};

export type StoryBriefWhenV1 = {
  simulationEpochStart?: string;
  planningHorizonDays?: number;
  useFeedCalendar?: boolean;
  storyArc?: EpisodeArcV1;
};

export type StoryBriefWhyV1 = {
  engagementLevelId?: string;
  intentIds?: string[];
  focusAreaId?: string;
  interestIds?: string[];
};

export type StoryBriefHowV1 = {
  journeyPace?: string;
  dramaticBeatIds?: Array<
    | 'exposition'
    | 'inciting_incident'
    | 'rising_action'
    | 'dilemma'
    | 'climax'
    | 'denouement'
  >;
  segmentPresetId?: string;
};

/** Story dimension snapshot (input to {@link buildStoryBrief}). */
export type StoryBriefSnapshotV1 = {
  who?: StoryBriefWhoV1;
  what?: StoryBriefWhatV1;
  where?: StoryBriefWhereV1;
  when?: StoryBriefWhenV1;
  why?: StoryBriefWhyV1;
  how?: StoryBriefHowV1;
  storyPitch?: string;
  storyId?: string;
  personaId?: string;
};

import type { StoryBriefDailyRhythmV1 } from './persona-daily-rhythm-format.js';

export type StoryBriefCharacterV1 = {
  id?: string;
  personaId: string;
  name?: string;
  age?: number;
  dailyRhythm?: StoryBriefDailyRhythmV1;
  actorDid?: string;
  householdSize?: number;
  occupation?: string;
  storyIds?: string[];
  psychology?: {
    pcmId?: string;
    segmentId?: string;
    segmentLabel?: string;
    mindset?: string;
    traits?: string[];
  };
};

export type AxmSegmentBriefRowV1 = {
  segmentId: string;
};
