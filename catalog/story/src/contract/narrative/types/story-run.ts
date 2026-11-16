import type { StoryClockCursor } from '../clock/story-clock-cursor.js';
import type { EpisodeArcV1 } from './episode-arc.js';
import type { EpisodeScheduledActivity } from './episode-activity.js';

/** PCM instance + compiled SAM episode at a story-clock cursor (portable run state). */
export type SamStoryRunState = {
  simulationEpochStart: string;
  storyArc: EpisodeArcV1;
  cursor: StoryClockCursor;
  /** Activities for the cursor day when a host timeline is available. */
  dayActivities?: readonly EpisodeScheduledActivity[];
};
