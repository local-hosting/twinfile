import { describe, expect, it } from 'vitest';

import {
  dayIndexForSceneOnHorizon,
  seekStoryEpisodeSceneOnArc,
  storySceneSeekRowsFromNarrative,
} from '../../src/contract/narrative/story/seek-story-episode-scene.js';
import type { EpisodeArcV1 } from '../../src/contract/narrative/types/episode-arc.js';
import type { StoryScene } from '../../src/contract/narrative/types/scene.js';

function sampleArc(): EpisodeArcV1 {
  return {
    version: 1,
    simulationEpochStart: '2026-01-06',
    planningHorizonDays: 10,
    visitDayIndex: 5,
    objectiveTouchpointIds: [],
    phases: {
      pre_visit: { startDayIndex: 0, endDayIndex: 4 },
      on_site: { dayIndex: 5 },
      post_visit: { startDayIndex: 6, endDayIndex: 9 },
    },
    touchpointSchedule: [],
  };
}

const scenes: StoryScene[] = [
  {
    id: 'scene-a',
    label: 'A',
    order: 0,
    actId: 'exposition',
    characterIds: ['persona:one'],
    placeRef: 'twinfile/place/one:0.0.0',
  },
  {
    id: 'scene-b',
    label: 'B',
    order: 1,
    actId: 'rising_action',
    characterIds: ['persona:one'],
    placeRef: 'twinfile/place/one:0.0.0',
  },
];

describe('seekStoryEpisodeSceneOnArc', () => {
  it('spreads scene indices across the planning horizon', () => {
    expect(dayIndexForSceneOnHorizon(0, 2, 10, 5)).toBe(0);
    expect(dayIndexForSceneOnHorizon(1, 2, 10, 5)).toBe(9);
  });

  it('advances to the next scene day index', () => {
    const rows = storySceneSeekRowsFromNarrative(scenes);
    const result = seekStoryEpisodeSceneOnArc({
      arc: sampleArc(),
      scenes: rows,
      currentDayIndex: 0,
      direction: 'forward',
    });
    expect(result.sceneId).toBe('scene-b');
    expect(result.dayIndex).toBe(9);
    expect(result.isoDate).toBe('2026-01-15');
  });
});
