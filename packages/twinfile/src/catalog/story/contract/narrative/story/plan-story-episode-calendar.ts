import { touchpointCatalogFromWire } from '../touchpoint/touchpoint-catalog.js';
import type { TouchpointGraphWire } from '../types/touchpoint-catalog.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import {
  buildCalendarDaysFromTimelineWire,
  type EpisodeCalendarDaysByIsoDate,
} from './build-calendar-days-from-timeline.js';
import { planEpisodeCalendarFromArc } from './plan-episode-calendar.js';
import type { StoryTimelineHostWire } from './timeline-host-wire.js';

export type PlanStoryEpisodeCalendarInput = {
  storyArc: EpisodeArcV1;
  touchpointSequence: readonly string[];
  subjectId: string;
  touchpointGraph?: TouchpointGraphWire;
};

export type PlanStoryEpisodeCalendarResult = {
  storyArc: EpisodeArcV1;
  touchpointSequence: readonly string[];
  timeline: StoryTimelineHostWire;
  calendarDays: EpisodeCalendarDaysByIsoDate;
};

/** Calendar + per-day schedule from a compiled episode arc (after mount compile). */
export function planStoryEpisodeCalendar(
  input: PlanStoryEpisodeCalendarInput,
): PlanStoryEpisodeCalendarResult {
  const touchpointCatalog = input.touchpointGraph
    ? touchpointCatalogFromWire(input.touchpointGraph)
    : undefined;

  const planned = planEpisodeCalendarFromArc({
    episodeArc: input.storyArc,
    subjectId: input.subjectId,
    touchpointCatalog,
  });

  return {
    storyArc: planned.storyArc,
    touchpointSequence: input.touchpointSequence,
    timeline: planned.timeline,
    calendarDays: buildCalendarDaysFromTimelineWire(planned.timeline, input.subjectId),
  };
}
