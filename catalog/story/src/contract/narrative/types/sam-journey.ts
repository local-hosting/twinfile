import type {
  HeartDimension,
  Journey,
  JourneyHeartTrend,
  JourneyObstacleOutcome,
  Obstacle,
} from '@local-hosting/twinfile-character/pcm';

/** Structure touchpoint row used to label ids on a journey (from AXM structure plane). */
export type SamJourneyTouchpoint = {
  id: string;
  label?: string;
  pageId?: string;
  flowId?: string;
};

export type SamJourneyJob = {
  id: string;
  text?: string;
};

/** @deprecated Use {@link SamJourneyJob}. */
export type SamJourneyNeed = SamJourneyJob;

/** AXM / org slices required to build a customer journey for an episode. */
export type SamJourneyContext = {
  journeys: readonly Journey[];
  touchpoints?: readonly SamJourneyTouchpoint[];
  obstacles?: readonly Obstacle[];
  jobs?: readonly SamJourneyJob[];
};

export type SamJourneyPhase = {
  id: string;
  label: string;
  order: number;
  touchpointLabels: string[];
  needLabels: string[];
  obstacles: { text: string; outcome: JourneyObstacleOutcome }[];
  heart: Record<HeartDimension, number>;
};

/** Built customer journey for one episode (bound PCM journey + org obstacles / touchpoints). */
export type SamJourney = {
  samId: string;
  samTitle: string;
  /** Bound PCM/AXM journey id (same as {@link id}). */
  journeyId: string;
  /** Journey id — AXM deliverables use this as the legacy journey key. */
  id: string;
  label: string;
  personaId: string;
  phases: SamJourneyPhase[];
  heartTrends: JourneyHeartTrend[];
};
