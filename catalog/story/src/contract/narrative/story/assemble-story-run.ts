import { simulationDateIso } from '../calendar/simulation-date.js';
import type { StoryClockCursor } from '../clock/story-clock-cursor.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { EpisodePhaseId } from '../types/episode-arc.js';
import type { EpisodeScheduledActivity } from '../types/episode-activity.js';
import type { SamStoryRunState } from '../types/story-run.js';
import { resolveStoryBeat, type StoryBeatSnapshot } from './resolve-story-beat.js';
import type { StoryTimelineActivityWire, StoryTimelineHostWire } from './timeline-host-wire.js';

function activityFromWire(block: StoryTimelineActivityWire): EpisodeScheduledActivity {
  return {
    id: block.id ?? `${block.kind}-${block.startTime}`,
    kind: block.kind as EpisodeScheduledActivity['kind'],
    startTime: block.startTime,
    endTime: block.endTime,
    touchpointId: block.touchpointId,
    journeyPhaseId: block.journeyPhaseId as EpisodePhaseId | undefined,
    label: block.label,
    jobId: block.jobId,
    venueOpportunityId: block.venueOpportunityId,
  };
}

export function resolveDayActivitiesFromTimelineWire(
  timeline: StoryTimelineHostWire | undefined,
  dayIndex: number,
  simulationEpochStart: string,
): readonly EpisodeScheduledActivity[] | undefined {
  if (!timeline) return undefined;
  const isoDate = simulationDateIso(dayIndex, simulationEpochStart);
  const entry = timeline[isoDate] ?? Object.values(timeline).find((row) => row.dayIndex === dayIndex);
  const activities = entry?.schedule?.activities;
  if (!activities?.length) return undefined;
  return activities.map(activityFromWire);
}

export type AssembledSamStoryRun = {
  run: SamStoryRunState;
  beat: StoryBeatSnapshot;
};

export function assembleSamStoryRun(input: {
  storyArc: EpisodeArcV1;
  cursor: StoryClockCursor;
  timeline?: StoryTimelineHostWire;
}): AssembledSamStoryRun {
  const simulationEpochStart = input.storyArc.simulationEpochStart;
  const dayActivities = resolveDayActivitiesFromTimelineWire(
    input.timeline,
    input.cursor.dayIndex,
    simulationEpochStart,
  );

  const run: SamStoryRunState = {
    simulationEpochStart,
    storyArc: input.storyArc,
    cursor: input.cursor,
    dayActivities,
  };

  const beat = resolveStoryBeat({
    cursor: input.cursor,
    simulationEpochStart,
    activities: dayActivities,
  });

  return { run, beat };
}
