import { simulationDateIso } from '../calendar/simulation-date.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';

/** Named beats hosts jump to when advancing a compiled SAM episode. */
export type StoryClockAdvanceTarget = 'visit_day' | 'post_visit';

/** Current story clock position on the episode horizon (sim day + hour-of-day). */
export type StoryClockPosition = {
  dayIndex: number;
  hourOfDay: number;
  isoDate: string;
  visitDayIndex: number;
  target: StoryClockAdvanceTarget;
};

export function resolveStoryClockDayIndex(
  arc: EpisodeArcV1,
  target: StoryClockAdvanceTarget,
): number {
  if (target === 'visit_day') {
    return arc.visitDayIndex;
  }
  return arc.phases.post_visit.startDayIndex;
}

export function defaultStoryClockHour(target: StoryClockAdvanceTarget): number {
  return target === 'visit_day' ? 11 : 10;
}

/** Resolve day index, wall date, and default hour for a story-clock advance target. */
export function resolveStoryClockPosition(
  arc: EpisodeArcV1,
  input: { target: StoryClockAdvanceTarget; hourOfDay?: number },
): StoryClockPosition {
  const target = input.target;
  const dayIndex = resolveStoryClockDayIndex(arc, target);
  const hourOfDay = input.hourOfDay ?? defaultStoryClockHour(target);
  return {
    dayIndex,
    hourOfDay,
    isoDate: simulationDateIso(dayIndex, arc.simulationEpochStart),
    visitDayIndex: arc.visitDayIndex,
    target,
  };
}
