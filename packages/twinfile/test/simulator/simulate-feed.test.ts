import { describe, expect, it } from 'vitest';

import { createClock } from '@local-hosting/twinfile/simulator';
import { compileFeedSeries } from '@local-hosting/twinfile/simulator';
import { generateSimulatedFeedRows } from '@local-hosting/twinfile/simulator';

describe('generateSimulatedFeedRows', () => {
  const clockSpec = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT2H', step: 'PT30M' };
  const clock = createClock(clockSpec);

  it('uplink delays known values', () => {
    const device = {
      id: 'sonde',
      unit: 'NTU',
      properties: ['turbidity'],
      simulate: {
        every: 'PT30M',
        uplink: 'PT1H',
        turbidity: { baseline: 10 },
      },
    };
    const rows = generateSimulatedFeedRows(device, clock, { release: 0 }, 1);
    expect(rows[0]?.available_at).toBe('2026-06-12T14:00:00Z');
    const series = compileFeedSeries(rows, 'sonde', 'turbidity');
    const startMs = clock.startMs;
    expect(series.valueAt(startMs + 1800 * 1000, 'step', clock.stepS * 1000)).toBe(10);
    expect(series.knownAt(startMs + 1800 * 1000)).toBeNull();
    expect(series.knownAt(startMs + 3600 * 1000)).toBe(10);
  });

  it('adds a phase-relative response bump', () => {
    const device = {
      id: 'sonde',
      properties: ['turbidity'],
      simulate: {
        every: 'PT1H',
        turbidity: {
          baseline: 0,
          response: { phase: 'release', peak: 100, rise: 'PT1H', decay: 'PT1H' },
        },
      },
    };
    const rows = generateSimulatedFeedRows(device, clock, { release: 0 }, 1);
    expect(rows[0]?.value).toBe(0);
    expect(rows[1]?.value).toBe(100);
    expect(rows[2]?.value).toBe(0);
  });
});
