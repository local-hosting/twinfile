import type {
  StoryTimelineActivityWire,
  StoryTimelineHostWire,
} from './timeline-host-wire.js';

export type EpisodeCalendarDayScheduleActivity = StoryTimelineActivityWire & {
  id: string;
};

export type EpisodeCalendarDayEntry = {
  version: 1;
  isoDate: string;
  dayIndex: number;
  schedule: {
    subjectId: string;
    dayIndex: number;
    activities: EpisodeCalendarDayScheduleActivity[];
  };
  regeneratedAt: string;
};

export type EpisodeCalendarDaysByIsoDate = Record<string, EpisodeCalendarDayEntry>;

/** Map SAM `StoryTimelineHostWire` to per-ISO-day calendar entries (host adds feed metadata). */
export function buildCalendarDaysFromTimelineWire(
  timeline: StoryTimelineHostWire,
  subjectId: string,
  regeneratedAt: string = new Date().toISOString(),
): EpisodeCalendarDaysByIsoDate {
  const days: EpisodeCalendarDaysByIsoDate = {};
  for (const [isoDate, row] of Object.entries(timeline)) {
    const activities: EpisodeCalendarDayScheduleActivity[] = [];
    for (const activity of row.schedule?.activities ?? []) {
      const id = String(activity.id ?? '').trim();
      if (!id) continue;
      activities.push({ ...activity, id });
    }
    days[isoDate] = {
      version: 1,
      isoDate,
      dayIndex: row.dayIndex,
      schedule: {
        subjectId,
        dayIndex: row.dayIndex,
        activities,
      },
      regeneratedAt,
    };
  }
  return days;
}
