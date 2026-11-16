import type { EpisodeArcV1, EpisodePhaseId } from '../types/episode-arc.js';
import type {
  EpisodeActivityCalendar,
  EpisodeActivityDay,
  EpisodeActivityKind,
  EpisodeScheduledActivity,
} from '../types/episode-activity.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import { resolveTouchpointLabel } from '../touchpoint/touchpoint-catalog.js';
import { simulationDateIso } from './simulation-date.js';

function activityKindForPhase(phase: EpisodePhaseId): EpisodeActivityKind {
  return phase === 'on_site' ? 'service' : 'dwell';
}

function activityBlockFromScheduleEntry(input: {
  entry: {
    dayIndex: number;
    hour: number;
    touchpointId: string;
    phase: EpisodePhaseId;
    venueKey?: string;
    spaceId?: string;
    sceneId?: string;
  };
  catalog?: SAMTouchpointCatalog;
  index?: TouchpointIndex;
}): EpisodeScheduledActivity {
  const startTime = input.entry.hour;
  const endTime = Math.min(24, startTime + 1);
  const label = resolveTouchpointLabel(input.entry.touchpointId, input.catalog, input.index);

  return {
    id: `story-${input.entry.phase}-${input.entry.touchpointId}-${input.entry.dayIndex}`,
    kind: activityKindForPhase(input.entry.phase),
    startTime,
    endTime,
    touchpointId: input.entry.touchpointId,
    journeyPhaseId: input.entry.phase,
    jobId: input.entry.touchpointId,
    label,
    venueKey: input.entry.venueKey,
    spaceId: input.entry.spaceId,
    sceneId: input.entry.sceneId,
    venueOpportunityId: input.entry.venueKey,
  };
}

export type BuildEpisodeActivityCalendarInput = {
  episodeArc: EpisodeArcV1;
  /** Persona or subject id — doppler `DailyActivitySchedule.subjectId`. */
  subjectId: string;
  touchpointCatalog?: SAMTouchpointCatalog;
  touchpointIndex?: TouchpointIndex;
  /** When true, emit a row for every horizon day (empty `activities` on quiet days). */
  includeEmptyDays?: boolean;
};

/** Map compiled {@link EpisodeArcV1} to doppler-compatible daily activity blocks. */
export function buildEpisodeActivityCalendar(
  input: BuildEpisodeActivityCalendarInput,
): EpisodeActivityCalendar {
  const { episodeArc } = input;
  const daysByIndex = new Map<number, EpisodeScheduledActivity[]>();

  for (const entry of episodeArc.touchpointSchedule) {
    const bucket = daysByIndex.get(entry.dayIndex) ?? [];
    bucket.push(
      activityBlockFromScheduleEntry({
        entry,
        catalog: input.touchpointCatalog,
        index: input.touchpointIndex,
      }),
    );
    daysByIndex.set(entry.dayIndex, bucket);
  }

  const days: EpisodeActivityDay[] = [];
  for (let dayIndex = 0; dayIndex < episodeArc.planningHorizonDays; dayIndex += 1) {
    const activities = daysByIndex.get(dayIndex) ?? [];
    if (!input.includeEmptyDays && activities.length === 0) {
      continue;
    }
    const sorted = [...activities].sort((left, right) => left.startTime - right.startTime);
    days.push({
      dayIndex,
      isoDate: simulationDateIso(dayIndex, episodeArc.simulationEpochStart),
      activities: sorted,
    });
  }

  return {
    subjectId: input.subjectId,
    simulationEpochStart: episodeArc.simulationEpochStart,
    planningHorizonDays: episodeArc.planningHorizonDays,
    days,
  };
}
