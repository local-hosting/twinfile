import { describe, expect, it } from 'vitest';

import { generateEpisodeCalendar } from '../../../../src/catalog/story/contract/narrative/calendar/generate-episode-calendar.js';

describe('scene place on schedule', () => {
  it('carries placeRef and sceneId on touchpoint schedule entries', () => {
    const result = generateEpisodeCalendar({
      source: 'scenes',
      scenes: [
        {
          id: 'scene:a',
          label: 'A',
          order: 0,
          actId: 'exposition',
          placeRef: 'twinfile/place/curbside:0.0.0',
          spaceId: 'space:curb',
          characterIds: ['persona:rider'],
          touchpointIds: ['touchpoint:open'],
        },
        {
          id: 'scene:b',
          label: 'B',
          order: 1,
          actId: 'rising_action',
          placeRef: 'twinfile/place/office:0.0.0',
          characterIds: ['persona:rider'],
          touchpointIds: ['touchpoint:map'],
        },
      ],
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 7,
      planningHorizonDays: 42,
    });

    const entry = result.episodeArc.touchpointSchedule.find((row) => row.touchpointId === 'touchpoint:open');
    expect(entry?.placeRef).toBe('twinfile/place/curbside:0.0.0');
    expect(entry?.sceneId).toBe('scene:a');
    expect(entry?.spaceId).toBe('space:curb');
  });
});
