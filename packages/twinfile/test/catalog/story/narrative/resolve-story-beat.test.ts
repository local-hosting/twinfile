import { describe, expect, it } from 'vitest';

import { resolveStoryBeat } from '../../../../src/contract/narrative/story/resolve-story-beat.js';

describe('resolveStoryBeat', () => {
  it('picks the activity covering the cursor hour', () => {
    const beat = resolveStoryBeat({
      cursor: { dayIndex: 28, hourOfDay: 11, hoursPerDay: 24, speedMultiplier: 1 },
      simulationEpochStart: '2026-09-28',
      activities: [
        {
          id: 'greeter',
          kind: 'service',
          startTime: 10,
          endTime: 12,
          touchpointId: 'greeter-kiosk',
          journeyPhaseId: 'on_site',
          label: 'Greeter',
        },
      ],
    });
    expect(beat.touchpointId).toBe('greeter-kiosk');
    expect(beat.isoDate).toBe('2026-10-26');
  });
});
