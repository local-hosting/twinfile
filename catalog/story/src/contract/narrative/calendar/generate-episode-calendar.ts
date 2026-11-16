import type { Journey } from '@doppler-group/twinfile-character/pcm';

import { resolvePlanningHorizonDays, resolveVisitDayIndex } from '../episode/planning-horizon.js';
import { extractTouchpointSequenceFromScenes } from '../scene/extract-touchpoint-sequence-from-scenes.js';
import { extractSceneTouchpointRows } from '../scene/extract-scene-touchpoint-rows.js';
import { hydrateScenesFromJourney } from '../scene/hydrate-scene-from-journey.js';
import { resolveJourneyFromCharacterContext } from '../contract/resolve-character-context.js';
import {
  buildEpisodeTouchpointSchedule,
  buildEpisodeTouchpointScheduleFromSceneRows,
} from '../episode/materialize-episode-arc.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type {
  BuildEpisodeCalendarDaysInput,
  EpisodeCalendarDays,
  EpisodeCalendarScheduledTouchpoint,
  GenerateEpisodeCalendarInput,
  GenerateEpisodeCalendarResult,
} from '../types/episode-calendar-generator.js';
import type { StoryScene } from '../types/scene.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import type { PlaceMount } from '../types/place-mount.js';
import { touchpointIndexFromCatalog } from '../touchpoint/touchpoint-catalog.js';
import { buildEpisodeActivityCalendar } from './build-episode-activity-calendar.js';
import { simulationDateIso } from './simulation-date.js';

function resolveTouchpointIndex(input: GenerateEpisodeCalendarInput): TouchpointIndex | undefined {
  if (input.touchpointCatalog) {
    return touchpointIndexFromCatalog(input.touchpointCatalog);
  }
  return input.touchpointIndex;
}

function mergeJourneyPace(input: GenerateEpisodeCalendarInput): string | undefined {
  return input.journeyPace ?? input.characterContext?.journeyPace;
}

function resolveScenesForCompile(
  scenes: readonly StoryScene[],
  input: GenerateEpisodeCalendarInput & { source: 'scenes' },
): StoryScene[] {
  let journey: Journey | undefined;
  if (input.characterContext) {
    journey =
      input.characterContext.journey ?? resolveJourneyFromCharacterContext(input.characterContext);
  }

  if (journey) {
    return hydrateScenesFromJourney(scenes, journey);
  }

  return [...scenes];
}

function resolveTouchpointSequence(input: GenerateEpisodeCalendarInput): readonly string[] {
  switch (input.source) {
    case 'sequence':
      return input.touchpointSequence;
    case 'scenes':
      return extractTouchpointSequenceFromScenes(input.scenes);
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

function buildEpisodeArcFromSequence(input: {
  touchpointSequence: readonly string[];
  simulationEpochStart: string;
  planningHorizonDays: number;
  visitDayIndex: number;
  touchpointIndex?: TouchpointIndex;
  scenes?: readonly StoryScene[];
  placeMounts?: readonly PlaceMount[];
  touchpointCatalog?: import('../types/touchpoint-catalog.js').SAMTouchpointCatalog;
}): EpisodeArcV1 {
  const touchpointSchedule =
    input.scenes?.length
      ? buildEpisodeTouchpointScheduleFromSceneRows({
          sceneRows: extractSceneTouchpointRows(input.scenes, {
            placeMounts: input.placeMounts,
            touchpointCatalog: input.touchpointCatalog,
          }),
          visitDayIndex: input.visitDayIndex,
          planningHorizonDays: input.planningHorizonDays,
          touchpointIndex: input.touchpointIndex,
        })
      : buildEpisodeTouchpointSchedule({
          touchpointSequence: input.touchpointSequence,
          visitDayIndex: input.visitDayIndex,
          planningHorizonDays: input.planningHorizonDays,
          touchpointIndex: input.touchpointIndex,
        });

  const lastDay = input.planningHorizonDays - 1;
  const visitDayIndex = input.visitDayIndex;

  return {
    version: 1,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays: input.planningHorizonDays,
    visitDayIndex,
    objectiveTouchpointIds: input.touchpointSequence,
    phases: {
      pre_visit: { startDayIndex: 0, endDayIndex: Math.max(0, visitDayIndex - 1) },
      on_site: { dayIndex: visitDayIndex },
      post_visit: {
        startDayIndex: Math.min(lastDay, visitDayIndex + 1),
        endDayIndex: lastDay,
      },
    },
    touchpointSchedule,
  };
}

/**
 * Low-level episode calendar (`EpisodeArcV1`) from storyboard scenes or an explicit touchpoint sequence.
 * Product hosts should use {@link compileSAM} (SAM + PCM + place mounts).
 */
export function generateEpisodeCalendar(
  input: GenerateEpisodeCalendarInput,
): GenerateEpisodeCalendarResult {
  const planningHorizonDays = resolvePlanningHorizonDays(input.planningHorizonDays);
  const visitDayIndex = resolveVisitDayIndex({
    visitDayIndex: input.visitDayIndex,
    journeyPace: mergeJourneyPace(input),
    planningHorizonDays,
    random: input.random,
  });

  const touchpointSequence = resolveTouchpointSequence(input);
  const touchpointIndex = resolveTouchpointIndex(input);

  const episodeArc = buildEpisodeArcFromSequence({
    touchpointSequence,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays,
    visitDayIndex,
    touchpointIndex,
    scenes:
      input.source === 'scenes'
        ? resolveScenesForCompile(input.scenes, input)
        : undefined,
    placeMounts: input.placeMounts,
    touchpointCatalog: input.touchpointCatalog,
  });

  const result: GenerateEpisodeCalendarResult = { episodeArc, touchpointSequence };

  if (input.subjectId) {
    result.activityCalendar = buildEpisodeActivityCalendar({
      episodeArc,
      subjectId: input.subjectId,
      touchpointCatalog: input.touchpointCatalog,
      touchpointIndex,
      includeEmptyDays: true,
    });
  }

  return result;
}

/** Map {@link EpisodeArcV1.touchpointSchedule} to ISO dates for hosts and simulation bridges. */
export function buildEpisodeCalendarDays(input: BuildEpisodeCalendarDaysInput): EpisodeCalendarDays {
  const { episodeArc } = input;
  const byIsoDate: Record<string, EpisodeCalendarScheduledTouchpoint[]> = {};

  if (input.includeEmptyDays) {
    for (let dayIndex = 0; dayIndex < episodeArc.planningHorizonDays; dayIndex += 1) {
      const isoDate = simulationDateIso(dayIndex, episodeArc.simulationEpochStart);
      byIsoDate[isoDate] = [];
    }
  }

  for (const row of episodeArc.touchpointSchedule) {
    const isoDate = simulationDateIso(row.dayIndex, episodeArc.simulationEpochStart);
    const bucket = byIsoDate[isoDate] ?? [];
    bucket.push({ ...row, isoDate });
    byIsoDate[isoDate] = bucket;
  }

  for (const isoDate of Object.keys(byIsoDate)) {
    byIsoDate[isoDate].sort((left, right) => left.hour - right.hour);
  }

  return {
    simulationEpochStart: episodeArc.simulationEpochStart,
    planningHorizonDays: episodeArc.planningHorizonDays,
    byIsoDate,
  };
}

/** Convenience: storyboard scenes (same scheduling as {@link compileSAM}). */
export function generateEpisodeCalendarFromScenes(input: {
  scenes: readonly StoryScene[];
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayIndex?: number;
  journeyPace?: string;
  touchpointIndex?: TouchpointIndex;
  random?: () => number;
}): GenerateEpisodeCalendarResult {
  return generateEpisodeCalendar({
    source: 'scenes',
    scenes: input.scenes,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays: input.planningHorizonDays,
    visitDayIndex: input.visitDayIndex,
    journeyPace: input.journeyPace,
    touchpointIndex: input.touchpointIndex,
    random: input.random,
  });
}
