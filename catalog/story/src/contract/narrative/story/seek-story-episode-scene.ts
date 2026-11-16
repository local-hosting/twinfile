import { simulationDateIso } from '../calendar/simulation-date.js';
import type { StoryClockCursor } from '../clock/story-clock-cursor.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryScene } from '../types/scene.js';

export type StorySceneSeekDirection = 'forward' | 'backward';

export type StorySceneSeekRow = {
  id: string;
  label: string;
  order: number;
  actId?: string;
  jobIds: string[];
};

export type SeekStoryEpisodeSceneInput = {
  direction: StorySceneSeekDirection;
  sceneId?: string;
  order?: number;
  hourOfDay?: number;
};

export type SeekStoryEpisodeSceneCoreResult = {
  dayIndex: number;
  isoDate: string;
  sceneId: string;
  sceneLabel: string;
  sceneOrder: number;
  actId?: string;
  jobIds: string[];
  direction: StorySceneSeekDirection;
  cursor: StoryClockCursor;
};

function orderedScenes(scenes: readonly StoryScene[]): StoryScene[] {
  return [...scenes].sort((left, right) => left.order - right.order);
}

/** Normalize Story storyboard rows for scene seek (order, labels, job ids). */
export function storySceneSeekRowsFromNarrative(
  scenes: readonly StoryScene[] | undefined,
): StorySceneSeekRow[] {
  const list = scenes ?? [];
  return orderedScenes(list)
    .map((scene) => ({
      id: String(scene.id ?? '').trim(),
      label: String(scene.label ?? scene.id ?? '').trim() || String(scene.id),
      order: typeof scene.order === 'number' ? scene.order : 0,
      actId: scene.actId ? String(scene.actId) : undefined,
      jobIds: Array.isArray(scene.jobIds)
        ? scene.jobIds.map((id) => String(id).trim()).filter(Boolean)
        : [],
    }))
    .filter((row) => row.id);
}

/** Map scene index to planning-horizon day (linear spread ending at visit day when one scene). */
export function dayIndexForSceneOnHorizon(
  sceneIndex: number,
  sceneCount: number,
  planningHorizonDays: number,
  visitDayIndex: number,
): number {
  if (sceneCount <= 1) return visitDayIndex;
  const last = Math.max(0, planningHorizonDays - 1);
  return Math.round((sceneIndex / (sceneCount - 1)) * last);
}

export function resolveStorySceneSeekTarget(
  scenes: readonly StorySceneSeekRow[],
  currentDayIndex: number,
  planningHorizonDays: number,
  visitDayIndex: number,
  input: Pick<SeekStoryEpisodeSceneInput, 'direction' | 'sceneId' | 'order'>,
): StorySceneSeekRow {
  if (scenes.length === 0) {
    throw new Error('Story has no scenes to seek');
  }

  if (input.sceneId?.trim()) {
    const hit = scenes.find((row) => row.id === input.sceneId!.trim());
    if (!hit) {
      throw new Error(`Unknown sceneId \`${input.sceneId}\``);
    }
    return hit;
  }

  if (typeof input.order === 'number') {
    const hit = scenes.find((row) => row.order === input.order);
    if (!hit) {
      throw new Error(`Unknown scene order ${input.order}`);
    }
    return hit;
  }

  const currentIndex = scenes.reduce((best, _row, index) => {
    const day = dayIndexForSceneOnHorizon(
      index,
      scenes.length,
      planningHorizonDays,
      visitDayIndex,
    );
    return Math.abs(day - currentDayIndex) <
      Math.abs(
        dayIndexForSceneOnHorizon(best, scenes.length, planningHorizonDays, visitDayIndex) -
          currentDayIndex,
      )
      ? index
      : best;
  }, 0);

  if (input.direction === 'forward') {
    const next = Math.min(scenes.length - 1, currentIndex + 1);
    if (next === currentIndex && currentIndex === scenes.length - 1) {
      throw new Error('Already at the last scene — cannot advance further');
    }
    return scenes[next]!;
  }

  const prev = Math.max(0, currentIndex - 1);
  if (prev === currentIndex && currentIndex === 0) {
    throw new Error('Already at the first scene — cannot rewind further');
  }
  return scenes[prev]!;
}

export function assertStorySceneSeekDirection(
  direction: StorySceneSeekDirection,
  fromDay: number,
  toDay: number,
): void {
  if (direction === 'forward' && toDay < fromDay) {
    throw new Error('That scene is earlier in the story — use rewind-story instead');
  }
  if (direction === 'backward' && toDay > fromDay) {
    throw new Error('That scene is later in the story — use advance-story instead');
  }
}

/**
 * Resolve story clock cursor + scene metadata for a seek (no host I/O).
 */
export function seekStoryEpisodeSceneOnArc(
  input: SeekStoryEpisodeSceneInput & {
    arc: EpisodeArcV1;
    scenes: readonly StorySceneSeekRow[];
    currentDayIndex: number;
    existingCursor?: StoryClockCursor;
  },
): SeekStoryEpisodeSceneCoreResult {
  const target = resolveStorySceneSeekTarget(
    input.scenes,
    input.currentDayIndex,
    input.arc.planningHorizonDays,
    input.arc.visitDayIndex,
    input,
  );
  const sceneIndex = input.scenes.findIndex((row) => row.id === target.id);
  const dayIndex = dayIndexForSceneOnHorizon(
    sceneIndex,
    input.scenes.length,
    input.arc.planningHorizonDays,
    input.arc.visitDayIndex,
  );
  assertStorySceneSeekDirection(input.direction, input.currentDayIndex, dayIndex);

  const hourOfDay =
    input.hourOfDay ?? input.existingCursor?.hourOfDay ?? 11;
  const cursor: StoryClockCursor = {
    dayIndex,
    hourOfDay,
    hoursPerDay: input.existingCursor?.hoursPerDay ?? 24,
    speedMultiplier: input.existingCursor?.speedMultiplier ?? 1,
  };

  const isoDate = simulationDateIso(dayIndex, input.arc.simulationEpochStart);

  return {
    dayIndex,
    isoDate,
    sceneId: target.id,
    sceneLabel: target.label,
    sceneOrder: target.order,
    actId: target.actId,
    jobIds: target.jobIds,
    direction: input.direction,
    cursor,
  };
}
