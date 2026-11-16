import { describe, expect, it } from 'vitest';

import { getRegisteredPlaceEvent } from '../src/catalog/event-catalog.js';
import { Weather, createWeathersFromPlace } from '../src/weather/weather.js';

describe('Weather', () => {
  const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT6H', step: 'PT5M' };

  it('fromPlaceEvent resolves severe-weather phase boundaries from args', () => {
    const event = getRegisteredPlaceEvent('severe-weather');
    expect(event).toBeDefined();
    const weather = Weather.fromPlaceEvent(event!, clock, { warningAt: 'PT30M' });
    expect(weather.id).toBe('severe-weather');
    expect(weather.phaseStarts.warning).toBe(1800);
    expect(weather.phaseAt(0)).toBe(undefined);
    expect(weather.phaseAt(1800)).toBe('warning');
  });

  it('edgesBetween emits phase.enter when scrubbing across a boundary', () => {
    const event = getRegisteredPlaceEvent('severe-weather');
    const weather = Weather.fromPlaceEvent(event!, clock, { warningAt: 'PT30M' });
    const edges = weather.edgesBetween(0, 3600);
    expect(edges).toEqual([{ kind: 'phase.enter', phase: 'warning', t: 1800 }]);
  });

  it('createWeathersFromPlace builds one Weather per event on the place', () => {
    const list = createWeathersFromPlace(
      clock,
      [
        {
          id: 'severe-weather',
          phases: ['watch', 'warning', 'all-clear'],
          args: { warningAt: { type: 'time' } },
        },
      ],
      { warningAt: 'PT1H' },
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.phaseStarts.warning).toBe(3600);
  });
});
