import type {
  HeartDimension,
  Journey,
  JourneyHeartTrend,
  JourneyObstacleOutcome,
  Obstacle,
} from '@doppler-group/twinfile-character/character';

/** Structure touchpoint row used to label ids on a journey (from AXM structure plane). */
export type StoryJourneyTouchpoint = {
  id: string;
  label?: string;
  pageId?: string;
  flowId?: string;
};

export type StoryJourneyJob = {
  id: string;
  text?: string;
};

/** @deprecated Use {@link StoryJourneyJob}. */
export type StoryJourneyNeed = StoryJourneyJob;

/** AXM / org slices required to build a customer journey for an episode. */
export type StoryJourneyContext = {
  journeys: readonly Journey[];
  touchpoints?: readonly StoryJourneyTouchpoint[];
  obstacles?: readonly Obstacle[];
  jobs?: readonly StoryJourneyJob[];
};

export type StoryJourneyPhase = {
  id: string;
  label: string;
  order: number;
  touchpointLabels: string[];
  needLabels: string[];
  obstacles: { text: string; outcome: JourneyObstacleOutcome }[];
  heart: Record<HeartDimension, number>;
};

/** Built customer journey for one episode (bound Character journey + org obstacles / touchpoints). */
export type StoryJourney = {
  storyId: string;
  storyTitle: string;
  /** Bound Character/AXM journey id (same as {@link id}). */
  journeyId: string;
  /** Journey id — AXM deliverables use this as the legacy journey key. */
  id: string;
  label: string;
  personaId: string;
  phases: StoryJourneyPhase[];
  heartTrends: JourneyHeartTrend[];
};
