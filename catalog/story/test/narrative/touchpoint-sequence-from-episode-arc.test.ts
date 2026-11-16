import { describe, expect, it } from 'vitest';

import { touchpointSequenceFromEpisodeArc } from '../../src/contract/narrative/episode/touchpoint-sequence-from-episode-arc.js';
import type { EpisodeArcV1 } from '../../src/contract/narrative/types/episode-arc.js';

describe('touchpointSequenceFromEpisodeArc', () => {
  it('returns a copy of objectiveTouchpointIds', () => {
    const arc: EpisodeArcV1 = {
      version: 1,
      simulationEpochStart: '2026-01-06',
      planningHorizonDays: 7,
      visitDayIndex: 3,
      objectiveTouchpointIds: ['tp-a', 'tp-b'],
      phases: {
        pre_visit: { startDayIndex: 0, endDayIndex: 2 },
        on_site: { dayIndex: 3 },
        post_visit: { startDayIndex: 4, endDayIndex: 6 },
      },
      touchpointSchedule: [],
    };
    const sequence = touchpointSequenceFromEpisodeArc(arc);
    expect(sequence).toEqual(['tp-a', 'tp-b']);
    expect(sequence).not.toBe(arc.objectiveTouchpointIds);
  });

  it('returns undefined when ids are missing', () => {
    expect(touchpointSequenceFromEpisodeArc(undefined)).toBeUndefined();
  });
});
