import { classifyTouchpointPhase } from '../journey/classify-touchpoint-phase.js';
import type { SceneTouchpointRow } from '../scene/extract-scene-touchpoint-rows.js';
import type { EpisodeArcV1, EpisodePhaseId, EpisodeTouchpointScheduleEntry } from '../types/episode-arc.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';

function spreadTouchpointsAcrossDays(input: {
  touchpointIds: readonly string[];
  startDayIndex: number;
  endDayIndex: number;
  phase: EpisodePhaseId;
  startHour: number;
}): EpisodeTouchpointScheduleEntry[] {
  if (input.touchpointIds.length === 0 || input.endDayIndex < input.startDayIndex) {
    return [];
  }

  const daySpan = input.endDayIndex - input.startDayIndex + 1;
  const entries: EpisodeTouchpointScheduleEntry[] = [];

  input.touchpointIds.forEach((touchpointId, index) => {
    const dayOffset =
      input.touchpointIds.length === 1
        ? 0
        : Math.floor((index * daySpan) / input.touchpointIds.length);
    const dayIndex = input.startDayIndex + dayOffset;
    const hour = Math.min(20, input.startHour + (index % 3));
    entries.push({
      dayIndex,
      hour,
      touchpointId,
      phase: input.phase,
    });
  });

  return entries;
}

function spreadSceneRowsAcrossDays(input: {
  rows: readonly SceneTouchpointRow[];
  startDayIndex: number;
  endDayIndex: number;
  phase: EpisodePhaseId;
  startHour: number;
  touchpointIndex?: TouchpointIndex;
}): EpisodeTouchpointScheduleEntry[] {
  if (input.rows.length === 0 || input.endDayIndex < input.startDayIndex) {
    return [];
  }

  const daySpan = input.endDayIndex - input.startDayIndex + 1;
  const entries: EpisodeTouchpointScheduleEntry[] = [];

  input.rows.forEach((row, index) => {
    const dayOffset =
      input.rows.length === 1 ? 0 : Math.floor((index * daySpan) / input.rows.length);
    const dayIndex = input.startDayIndex + dayOffset;
    const hour = Math.min(20, input.startHour + (index % 3));
    entries.push({
      dayIndex,
      hour,
      touchpointId: row.touchpointId,
      phase: input.phase,
      sceneId: row.sceneId,
      placeRef: row.placeRef,
      spaceId: row.spaceId,
      visitMomentId: row.visitMomentId,
      characterIds: row.characterIds,
    });
  });

  return entries;
}

export function buildEpisodeTouchpointSchedule(input: {
  touchpointSequence: readonly string[];
  visitDayIndex: number;
  planningHorizonDays: number;
  touchpointIndex?: TouchpointIndex;
}): EpisodeTouchpointScheduleEntry[] {
  const pre: string[] = [];
  const onSite: string[] = [];
  const post: string[] = [];

  for (const touchpointId of input.touchpointSequence) {
    const phase = classifyTouchpointPhase(touchpointId, input.touchpointIndex);
    if (phase === 'pre_visit') pre.push(touchpointId);
    else if (phase === 'post_visit') post.push(touchpointId);
    else onSite.push(touchpointId);
  }

  const visitDay = input.visitDayIndex;
  const lastDay = input.planningHorizonDays - 1;

  return [
    ...spreadTouchpointsAcrossDays({
      touchpointIds: pre,
      startDayIndex: 0,
      endDayIndex: Math.max(0, visitDay - 1),
      phase: 'pre_visit',
      startHour: 9,
    }),
    ...spreadTouchpointsAcrossDays({
      touchpointIds: onSite,
      startDayIndex: visitDay,
      endDayIndex: visitDay,
      phase: 'on_site',
      startHour: 10,
    }),
    ...spreadTouchpointsAcrossDays({
      touchpointIds: post,
      startDayIndex: Math.min(lastDay, visitDay + 1),
      endDayIndex: lastDay,
      phase: 'post_visit',
      startHour: 11,
    }),
  ];
}

export function buildEpisodeTouchpointScheduleFromSceneRows(input: {
  sceneRows: readonly SceneTouchpointRow[];
  visitDayIndex: number;
  planningHorizonDays: number;
  touchpointIndex?: TouchpointIndex;
}): EpisodeTouchpointScheduleEntry[] {
  const pre: SceneTouchpointRow[] = [];
  const onSite: SceneTouchpointRow[] = [];
  const post: SceneTouchpointRow[] = [];

  for (const row of input.sceneRows) {
    const phase = classifyTouchpointPhase(row.touchpointId, input.touchpointIndex);
    if (phase === 'pre_visit') pre.push(row);
    else if (phase === 'post_visit') post.push(row);
    else onSite.push(row);
  }

  const visitDay = input.visitDayIndex;
  const lastDay = input.planningHorizonDays - 1;

  return [
    ...spreadSceneRowsAcrossDays({
      rows: pre,
      startDayIndex: 0,
      endDayIndex: Math.max(0, visitDay - 1),
      phase: 'pre_visit',
      startHour: 9,
      touchpointIndex: input.touchpointIndex,
    }),
    ...spreadSceneRowsAcrossDays({
      rows: onSite,
      startDayIndex: visitDay,
      endDayIndex: visitDay,
      phase: 'on_site',
      startHour: 10,
      touchpointIndex: input.touchpointIndex,
    }),
    ...spreadSceneRowsAcrossDays({
      rows: post,
      startDayIndex: Math.min(lastDay, visitDay + 1),
      endDayIndex: lastDay,
      phase: 'post_visit',
      startHour: 11,
      touchpointIndex: input.touchpointIndex,
    }),
  ];
}

