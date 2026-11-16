import { describe, expect, it } from 'vitest';

import { generateEpisodeCalendar } from '../../src/contract/narrative/calendar/generate-episode-calendar.js';

describe('scene venue on schedule', () => {
  it('carries venueKey and sceneId on touchpoint schedule entries', () => {
    const result = generateEpisodeCalendar({
      source: 'scenes',
      scenes: [
        {
          id: 'scene:a',
          label: 'A',
          order: 0,
          actId: 'exposition',
          venueKey: 'venue:curbside',
          spaceId: 'space:curb',
          characterIds: ['persona:rider'],
          touchpointIds: ['touchpoint:open'],
        },
        {
          id: 'scene:b',
          label: 'B',
          order: 1,
          actId: 'rising_action',
          venueKey: 'venue:office',
          characterIds: ['persona:rider'],
          touchpointIds: ['touchpoint:map'],
        },
      ],
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 7,
      planningHorizonDays: 42,
    });

    const entry = result.episodeArc.touchpointSchedule.find((row) => row.touchpointId === 'touchpoint:open');
    expect(entry?.venueKey).toBe('venue:curbside');
    expect(entry?.sceneId).toBe('scene:a');
    expect(entry?.spaceId).toBe('space:curb');
  });
});
