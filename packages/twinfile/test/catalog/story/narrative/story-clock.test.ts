import { describe, expect, it } from 'vitest';

import {
  defaultStoryClockHour,
  resolveStoryClockDayIndex,
  resolveStoryClockPosition,
} from '../../../../src/contract/narrative/clock/story-clock.js';
import type { EpisodeArcV1 } from '../../../../src/contract/narrative/types/episode-arc.js';

function sampleArc(): EpisodeArcV1 {
  return {
    version: 1,
    simulationEpochStart: '2026-09-28',
    planningHorizonDays: 56,
    visitDayIndex: 28,
    objectiveTouchpointIds: ['greeter-kiosk'],
    phases: {
      pre_visit: { startDayIndex: 0, endDayIndex: 27 },
      on_site: { dayIndex: 28 },
      post_visit: { startDayIndex: 29, endDayIndex: 55 },
    },
    touchpointSchedule: [],
  };
}

describe('story clock', () => {
  it('resolves visit and post-visit day indices from episodeArc', () => {
    const arc = sampleArc();
    expect(resolveStoryClockDayIndex(arc, 'visit_day')).toBe(28);
    expect(resolveStoryClockDayIndex(arc, 'post_visit')).toBe(29);
  });

  it('defaults visit day to hour 11 and post-visit to hour 10', () => {
    expect(defaultStoryClockHour('visit_day')).toBe(11);
    expect(defaultStoryClockHour('post_visit')).toBe(10);
  });

  it('maps day index to ISO date via simulation epoch', () => {
    const position = resolveStoryClockPosition(sampleArc(), { target: 'visit_day' });
    expect(position.isoDate).toBe('2026-10-26');
    expect(position.hourOfDay).toBe(11);
    expect(position.visitDayIndex).toBe(28);
  });
});
