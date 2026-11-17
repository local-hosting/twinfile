import type { AXMEncounter, AXMEncounterChannel } from '../identity/encounter.js';
import type { HeartDimension } from '../story/heart.js';
import type { JourneyObstacleEncounter } from '../story/obstacle.js';

export type JourneyEmotionBand = 'low' | 'mid' | 'high';

export type JourneyEmotionValence = 'negative' | 'neutral' | 'positive';

/** Phase- or moment-scoped emotion — slides use `band`; timelines may use `feelings` / `curve`. */
export type JourneyEmotions = {
  band?: JourneyEmotionBand;
  valence?: JourneyEmotionValence;
  feelings?: string[];
  /** Narrative arc sample in −1…1 (emotional curve). */
  curve?: number;
};

/** @deprecated Inline touchpoints — define {@link StructureTouchpoint} on structure and use `touchpointIds`. */
export type JourneyTouchpointRef = {
  pageId?: string;
  flowId?: string;
  channel?: AXMEncounterChannel | (string & {});
  label?: string;
  encounter?: AXMEncounter;
};

/** Timeline row — Month / Moment / Job stories / Emotion spreadsheets map here. */
export type JourneyMoment = {
  id: string;
  label: string;
  order: number;
  /** Calendar bucket, e.g. `2021-10` or `OCT 2021`. */
  period?: string;
  narrativeBeat?: string;
  /** Context / circumstance (JTBD). */
  context?: string;
  /** JTBD job ids active in this moment. */
  jobIds?: string[];
  touchpointIds: string[];
  emotions?: JourneyEmotions;
  pain?: string;
  gain?: string;
  obstacles?: JourneyObstacleEncounter[];
};

export type JourneyPhase = {
  id: string;
  label: string;
  order: number;
  goal?: string;
  description?: string;
  /** Context / circumstance (JTBD). */
  context?: string;
  narrativeBeat?: string;
  /** JTBD job ids this phase addresses. */
  jobIds: string[];
  touchpointIds: string[];
  emotions: JourneyEmotions;
  pain?: string;
  gain?: string;
  obstacles?: JourneyObstacleEncounter[];
  moments?: JourneyMoment[];
};

/** @deprecated Author `arcTemplate` and `scenes` on {@link https://github.com/twinfile/persona/tree/main/packages/story `@doppler-group/twinfile-story/narrative`} instead. */
export type JourneyNarrativeArcBeat = {
  phaseId?: string;
  momentId?: string;
  beat: string;
  order: number;
  valence?: JourneyEmotionValence;
};

/** @deprecated Author `arcTemplate` and `scenes` on `@doppler-group/twinfile-story/narrative` instead. */
export type JourneyNarrativeArc = {
  summary?: string;
  beats?: JourneyNarrativeArcBeat[];
};

export type Journey = {
  id: string;
  label: string;
  characterId: string;
  /** Thinking style the persona wears in this journey's context (an "episode"). */
  thinkingStyleId?: string;
  description?: string;
  journeyGoal?: string;
  /** Group related journeys (e.g. virtual expo E1 vs ongoing E2). */
  seriesId?: string;
  seriesOrder?: number;
  phases: JourneyPhase[];
  /** @deprecated Use Story `arcTemplate` / `scenes` for storyboard beats. */
  narrativeArc?: JourneyNarrativeArc;
  /** HEART values (0…1) before the first phase; unset dimensions start at 0.5. */
  heartBaseline?: Partial<Record<HeartDimension, number>>;
};

/** Materialized journey trace edge (AXM graph). */
export type JourneyRelationshipEdge =
  | { kind: 'journey_for_character'; journeyId: string; characterId: string }
  | { kind: 'journey_phase_job'; journeyId: string; phaseId: string; jobId: string }
  | { kind: 'journey_moment_job'; journeyId: string; momentId: string; jobId: string }
  | {
      kind: 'journey_phase_touchpoint';
      journeyId: string;
      phaseId: string;
      touchpointId: string;
    }
  | {
      kind: 'journey_moment_touchpoint';
      journeyId: string;
      momentId: string;
      touchpointId: string;
    }
  | { kind: 'journey_phase_obstacle'; journeyId: string; phaseId: string; obstacleId: string }
  | { kind: 'journey_moment_obstacle'; journeyId: string; momentId: string; obstacleId: string };
