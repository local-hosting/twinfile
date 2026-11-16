import { describe, expect, it } from 'vitest';

import { generateEpisodeCalendar } from '../../src/contract/narrative/calendar/generate-episode-calendar.js';
import { touchpointCatalogFromWire } from '../../src/contract/narrative/touchpoint/touchpoint-catalog.js';
import { resolveTouchpointVenueAtScene } from '../../src/contract/narrative/touchpoint/resolve-touchpoint-venue.js';

describe('physical touchpoint → place', () => {
  it('uses catalog venueKey for physical touchpoints when scene omits override', () => {
    const catalog = touchpointCatalogFromWire({
      touchpoints: [
        { id: 'touchpoint:open', locus: 'digital' },
        { id: 'touchpoint:kiosk', locus: 'physical', venueKey: 'venue:store' },
      ],
    });
    const scene = {
      id: 'scene:1',
      label: 'Visit',
      order: 0,
      actId: 'exposition' as const,
      characterIds: ['persona:a'],
      venueKey: 'venue:default',
      touchpointIds: ['touchpoint:kiosk'],
    };
    const venue = resolveTouchpointVenueAtScene({
      touchpointId: 'touchpoint:kiosk',
      scene,
      touchpointCatalog: catalog,
    });
    expect(venue.venueKey).toBe('venue:store');
  });

  it('scene touchpoint ref overrides catalog and scene default', () => {
    const result = generateEpisodeCalendar({
      source: 'scenes',
      scenes: [
        {
          id: 'scene:a',
          label: 'A',
          order: 0,
          actId: 'exposition',
          venueKey: 'venue:home',
          characterIds: ['persona:rider'],
          touchpoints: [
            { id: 'touchpoint:map', venueKey: 'venue:car' },
          ],
        },
      ],
      touchpointCatalog: touchpointCatalogFromWire({
        touchpoints: [{ id: 'touchpoint:map', locus: 'physical', venueKey: 'venue:wrong' }],
      }),
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 5,
      planningHorizonDays: 42,
    });

    const row = result.episodeArc.touchpointSchedule.find((e) => e.touchpointId === 'touchpoint:map');
    expect(row?.venueKey).toBe('venue:car');
  });
});
