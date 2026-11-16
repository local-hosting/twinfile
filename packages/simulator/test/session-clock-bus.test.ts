import { describe, expect, it } from 'vitest';

import {
  createSessionClockBus,
  sessionClockNoteTimes,
} from '@local-hosting/twinfile-simulator';
import { createWorldSession } from '@local-hosting/twinfile-simulator';

describe('session clock bus', () => {
  const mergedPlace = {
    place: { timezone: 'America/New_York', location: { lat: 41.309, lng: -74.152 } },
    tracks: [{ id: 'daylight', source: 'solar' as const }],
  };
  const clock = { starts_at: '2026-06-12T02:00:00-04:00', duration: 'PT8H', step: 'PT1H' };

  it('note times walk the step grid like a scale', () => {
    expect(sessionClockNoteTimes(0, 3600, 3600)).toEqual([3600]);
    expect(sessionClockNoteTimes(0, 7200, 3600)).toEqual([3600, 7200]);
    expect(sessionClockNoteTimes(7200, 0, 3600)).toEqual([3600, 0]);
  });

  it('emits one note per stepForward', () => {
    const bus = createSessionClockBus({ record: true });
    const session = createWorldSession({
      clock,
      place: mergedPlace,
      placeRoot: '/tmp',
      seed: 1,
      bus,
    });
    session.stepForward();
    const types = bus.records?.map((row) => row.type) ?? [];
    expect(types).toContain('note');
    expect(types).toContain('advance');
    const notes = bus.records?.filter((row) => row.type === 'note') ?? [];
    expect(notes.at(-1) && notes.at(-1)!.type === 'note' ? notes.at(-1)!.payload.index : -1).toBe(1);
  });
});
