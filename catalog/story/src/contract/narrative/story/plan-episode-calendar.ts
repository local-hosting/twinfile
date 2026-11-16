import { buildEpisodeActivityCalendar, type BuildEpisodeActivityCalendarInput } from '../calendar/build-episode-activity-calendar.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryTimelineDayWire, StoryTimelineHostWire } from './timeline-host-wire.js';
import { simulationDateIso } from '../calendar/simulation-date.js';

export type PlanEpisodeCalendarResult = {
  storyArc: EpisodeArcV1;
  timeline: StoryTimelineHostWire;
};

/** Build host `when.timeline` days from a compiled episode arc (SAM story clock schedule). */
export function planEpisodeCalendarFromArc(
  input: BuildEpisodeActivityCalendarInput & { episodeArc: EpisodeArcV1 },
): PlanEpisodeCalendarResult {
  const { episodeArc } = input;
  const activityCalendar = buildEpisodeActivityCalendar({
    ...input,
    episodeArc,
    includeEmptyDays: true,
  });

  const timeline: StoryTimelineHostWire = {};

  for (const day of activityCalendar.days) {
    timeline[day.isoDate] = {
      dayIndex: day.dayIndex,
      schedule: {
        activities: day.activities.map((activity) => ({
          id: activity.id,
          kind: activity.kind,
          startTime: activity.startTime,
          endTime: activity.endTime,
          touchpointId: activity.touchpointId,
          journeyPhaseId: activity.journeyPhaseId,
          label: activity.label,
          jobId: activity.jobId,
          placeOpportunityId: activity.placeOpportunityId ?? activity.placeRef,
        })),
      },
    };
  }

  for (let dayIndex = 0; dayIndex < episodeArc.planningHorizonDays; dayIndex += 1) {
    const isoDate = simulationDateIso(dayIndex, episodeArc.simulationEpochStart);
    if (!timeline[isoDate]) {
      timeline[isoDate] = { dayIndex, schedule: { activities: [] } };
    }
  }

  return { storyArc: episodeArc, timeline };
}
