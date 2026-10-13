import {
  resolveStoryClockPosition,
  type StoryClockAdvanceTarget,
} from '../clock/story-clock.js';
import type { StoryClockCursor } from '../clock/story-clock-cursor.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';

export function advanceStoryClockForArc(
  arc: EpisodeArcV1,
  input: {
    target: StoryClockAdvanceTarget;
    hourOfDay?: number;
    existing?: StoryClockCursor;
  },
): StoryClockCursor {
  const position = resolveStoryClockPosition(arc, {
    target: input.target,
    hourOfDay: input.hourOfDay,
  });
  const hoursPerDay = input.existing?.hoursPerDay ?? 24;
  const speedMultiplier = input.existing?.speedMultiplier ?? 1;
  return {
    dayIndex: position.dayIndex,
    hourOfDay: position.hourOfDay,
    hoursPerDay,
    speedMultiplier,
  };
}
