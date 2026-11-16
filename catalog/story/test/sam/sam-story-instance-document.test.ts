import { describe, expect, it } from 'vitest';
import type { EpisodeArcV1 } from '../../src/contract/narrative/types/episode-arc.js';
import {
  SamStoryInstanceDocument,
  storyCharacteristicsFromJSON,
} from '../../src/contract/narrative/story/sam-story-instance-document.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

const arc: EpisodeArcV1 = {
  version: 1,
  simulationEpochStart: '2026-09-28',
  planningHorizonDays: 56,
  visitDayIndex: 28,
  objectiveTouchpointIds: ['touchpoint:a'],
  phases: {
    pre_visit: { startDayIndex: 0, endDayIndex: 27 },
    on_site: { dayIndex: 28 },
    post_visit: { startDayIndex: 29, endDayIndex: 55 },
  },
  touchpointSchedule: [],
};

describe('SamStoryInstanceDocument', () => {
  it('stores clock and timeline without the SAM template', () => {
    const sam = storyboardSamFixture({ episodeArc: arc });
    const timeline = {};
    const doc = SamStoryInstanceDocument.fromCompiled(sam, { timeline, startHour: 10 });
    const json = doc.toJSON();
    expect(json.clock).toBeDefined();
    expect(json.timeline).toEqual(timeline);
    expect(json).not.toHaveProperty('episodeArc');
    expect(json).not.toHaveProperty('scenes');
    expect(() => storyCharacteristicsFromJSON({ ...json, episodeArc: arc })).toThrow(/SAM template/);
    const restored = SamStoryInstanceDocument.compose(sam, storyCharacteristicsFromJSON(json));
    expect(restored.episodeArc?.visitDayIndex).toBe(sam.episodeArc?.visitDayIndex);
  });
});
