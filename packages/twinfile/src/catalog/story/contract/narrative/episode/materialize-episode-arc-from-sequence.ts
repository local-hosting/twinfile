import { generateEpisodeCalendarFromScenes } from '../calendar/generate-episode-calendar.js';
import type { StoryScene } from '../types/scene.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';

export type MaterializeEpisodeArcFromScenesInput = {
  scenes: readonly StoryScene[];
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayIndex?: number;
  journeyPace?: string;
  touchpointIndex?: TouchpointIndex;
  random?: () => number;
};

export function materializeEpisodeArcFromScenes(
  input: MaterializeEpisodeArcFromScenesInput,
): EpisodeArcV1 {
  return generateEpisodeCalendarFromScenes(input).episodeArc;
}
