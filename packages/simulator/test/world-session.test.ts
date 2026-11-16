import { describe, expect, it } from 'vitest';

import { createWorldClockPlayback } from '@doppler-group/twinfile-simulator';
import { createWorldSession } from '@doppler-group/twinfile-simulator';

describe('world session', () => {
  const mergedPlace = {
    place: { timezone: 'America/New_York', location: { lat: 41.309, lng: -74.152 } },
    schedules: [
      {
        id: 'shore-work',
        when: 'Mo-Su 06:00-20:00',
        uses: { space: 'eddy-pool' },
        activeWhen: { track: 'daylight', min: 0 },
      },
    ],
    tracks: [
      { id: 'daylight', source: 'solar' as const },
      { id: 'working', source: 'schedule' as const, schedule: 'shore-work' },
    ],
  };

  const clock = { starts_at: '2026-06-12T02:00:00-04:00', duration: 'PT8H', step: 'PT1H' };

  it('advances on stepForward and emits schedule edges', () => {
    const session = createWorldSession({
      clock,
      place: mergedPlace,
      placeRoot: '/tmp',
      seed: 1,
    });
    expect(session.playheadT).toBe(0);
    expect(session.sample().active).toEqual([]);
    const advance = session.stepForward();
    expect(advance.playheadT).toBe(3600);
    const ids = advance.edges.filter((e) => e.kind === 'schedule.start').map((e) => e.scheduleId);
    expect(ids.length).toBeGreaterThanOrEqual(0);
  });

  it('playback tick advances playhead while playing', () => {
    const playback = createWorldClockPlayback({
      clock,
      place: mergedPlace,
      placeRoot: '/tmp',
      seed: 1,
      timezone: 'America/New_York',
      speed: 60,
    });
    expect(playback.localAt()).toMatch(/^2026-06-12T0?2:/);
    playback.play();
    const stepMs = playback.wallMsPerStep();
    const moved = playback.tickWallMs(stepMs);
    expect(moved).toBeDefined();
    expect(playback.session.playheadT).toBe(3600);
    playback.pause();
    expect(playback.tickWallMs(stepMs)).toBeUndefined();
  });
});
