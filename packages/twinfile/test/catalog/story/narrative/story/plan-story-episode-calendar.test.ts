import { describe, expect, it } from 'vitest';
import { planStoryEpisodeCalendar } from '../../../../../src/catalog/story/contract/narrative/story/plan-story-episode-calendar.js';

describe('planStoryEpisodeCalendar', () => {
  it('builds timeline and calendar days from a minimal arc', () => {
    const storyArc = {
      version: 1 as const,
      simulationEpochStart: '2026-01-06',
      planningHorizonDays: 7,
      visitDayIndex: 3,
      objectiveTouchpointIds: ['tp-a'],
      phases: {
        pre_visit: { startDayIndex: 0, endDayIndex: 2 },
        on_site: { dayIndex: 3 },
        post_visit: { startDayIndex: 4, endDayIndex: 6 },
      },
      touchpointSchedule: [],
    };

    const result = planStoryEpisodeCalendar({
      storyArc,
      touchpointSequence: ['tp-a'],
      subjectId: 'persona:demo',
    });

    expect(result.touchpointSequence).toEqual(['tp-a']);
    expect(Object.keys(result.timeline).length).toBeGreaterThanOrEqual(7);
    expect(result.calendarDays['2026-01-06']?.schedule.subjectId).toBe('persona:demo');
  });
});
