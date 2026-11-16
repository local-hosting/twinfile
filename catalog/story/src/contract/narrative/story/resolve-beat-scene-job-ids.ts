import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryScene } from '../types/scene.js';
import { dayIndexForSceneOnHorizon, storySceneSeekRowsFromSam } from './seek-story-episode-scene.js';
import type { StoryBeatSnapshot } from './resolve-story-beat.js';

function uniqueSorted(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();
}

/** Job ids for the active scene at the beat day plus the scheduled activity job (if any). */
export function resolveStoryBeatSceneJobIds(input: {
  beat: Pick<StoryBeatSnapshot, 'dayIndex' | 'activity'>;
  scenes: readonly StoryScene[] | undefined;
  arc: EpisodeArcV1;
}): string[] {
  const rows = storySceneSeekRowsFromSam(input.scenes);
  if (rows.length === 0) {
    const activityJob = input.beat.activity?.jobId?.trim();
    return activityJob ? [activityJob] : [];
  }

  const currentIndex = rows.reduce((best, _row, index) => {
    const day = dayIndexForSceneOnHorizon(
      index,
      rows.length,
      input.arc.planningHorizonDays,
      input.arc.visitDayIndex,
    );
    return Math.abs(day - input.beat.dayIndex) <
      Math.abs(
        dayIndexForSceneOnHorizon(best, rows.length, input.arc.planningHorizonDays, input.arc.visitDayIndex) -
          input.beat.dayIndex,
      )
      ? index
      : best;
  }, 0);

  const sceneJobIds = rows[currentIndex]?.jobIds ?? [];
  const activityJob = input.beat.activity?.jobId?.trim();
  return uniqueSorted([...sceneJobIds, ...(activityJob ? [activityJob] : [])]);
}
