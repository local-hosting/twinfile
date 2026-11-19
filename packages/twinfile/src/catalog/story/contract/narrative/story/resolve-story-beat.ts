import { simulationDateIso } from '../calendar/simulation-date.js';
import type { EpisodeScheduledActivity } from '../types/episode-activity.js';
import type { StoryClockCursor } from '../clock/story-clock-cursor.js';

export type StoryBeatSnapshot = {
  dayIndex: number;
  hourOfDay: number;
  isoDate: string;
  activity?: EpisodeScheduledActivity;
  touchpointId?: string;
  journeyPhaseId?: string;
  label?: string;
  kind?: string;
};

export function resolveActivityAtHour(
  activities: readonly EpisodeScheduledActivity[],
  hourOfDay: number,
): EpisodeScheduledActivity | undefined {
  return activities.find((row) => row.startTime <= hourOfDay && row.endTime > hourOfDay);
}

export function resolveStoryBeat(input: {
  cursor: StoryClockCursor;
  simulationEpochStart: string;
  activities?: readonly EpisodeScheduledActivity[];
}): StoryBeatSnapshot {
  const isoDate = simulationDateIso(input.cursor.dayIndex, input.simulationEpochStart);
  const activity = input.activities
    ? resolveActivityAtHour(input.activities, input.cursor.hourOfDay)
    : undefined;

  return {
    dayIndex: input.cursor.dayIndex,
    hourOfDay: input.cursor.hourOfDay,
    isoDate,
    activity,
    touchpointId: activity?.touchpointId,
    journeyPhaseId: activity?.journeyPhaseId,
    label: activity?.label,
    kind: activity?.kind,
  };
}
