import { describe, expect, it } from 'vitest';

import { createTimeline } from '@local-hosting/twinfile-simulator';

describe('schedule activeWhen', () => {
  const mergedPlace = {
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
    visits: [
      {
        id: 'visit-eddy-sample',
        kind: 'activity',
        space: 'eddy-pool',
        order: 0,
        during: 'shore-work',
      },
    ],
  };

  const clock = { starts_at: '2026-06-12T02:00:00-04:00', duration: 'PT8H', step: 'PT1H' };

  it('suppresses active schedules before sunrise', () => {
    const timeline = createTimeline({
      clock,
      timezone: 'America/New_York',
      location: { lat: 41.309, lng: -74.152 },
      mergedPlace,
      seed: 1,
    });
    expect(timeline.at(0).active).toEqual([]);
    expect(timeline.at(0).occupancy).toEqual([]);
    expect(timeline.at(0).tracks.working).toBe(0);
  });

  it('reports occupancy and visit beats during daylight windows', () => {
    const timeline = createTimeline({
      clock,
      timezone: 'America/New_York',
      location: { lat: 41.309, lng: -74.152 },
      mergedPlace,
      seed: 1,
    });
    const sample = timeline.at(21_600);
    expect(sample.active.map((a) => a.id)).toEqual(['shore-work']);
    expect(sample.occupancy[0]?.schedule).toBe('shore-work');
    expect(sample.occupancy[0]?.space).toBe('eddy-pool');
    expect(sample.visit_beats).toEqual([
      { id: 'visit-eddy-sample', space: 'eddy-pool', kind: 'activity', schedule: 'shore-work' },
    ]);
    expect(sample.tracks.working).toBe(1);
  });
});
