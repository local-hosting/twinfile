import { describe, expect, it } from 'vitest';

import { generateEpisodeCalendar } from '../../../../src/contract/narrative/calendar/generate-episode-calendar.js';
import { touchpointCatalogFromWire } from '../../../../src/contract/narrative/touchpoint/touchpoint-catalog.js';
import { resolveTouchpointPlaceAtScene } from '../../../../src/contract/narrative/touchpoint/resolve-touchpoint-place.js';

describe('physical touchpoint → place', () => {
  it('uses catalog placeRef for physical touchpoints when scene omits override', () => {
    const catalog = touchpointCatalogFromWire({
      touchpoints: [
        { id: 'touchpoint:open', locus: 'digital' },
        { id: 'touchpoint:kiosk', locus: 'physical', placeRef: 'twinfile/place/store:0.0.0' },
      ],
    });
    const scene = {
      id: 'scene:1',
      label: 'Visit',
      order: 0,
      actId: 'exposition' as const,
      characterIds: ['persona:a'],
      placeRef: 'twinfile/place/default:0.0.0',
      touchpointIds: ['touchpoint:kiosk'],
    };
    const place = resolveTouchpointPlaceAtScene({
      touchpointId: 'touchpoint:kiosk',
      scene,
      touchpointCatalog: catalog,
    });
    expect(place.placeRef).toBe('twinfile/place/store:0.0.0');
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
          placeRef: 'twinfile/place/home:0.0.0',
          characterIds: ['persona:rider'],
          touchpoints: [
            { id: 'touchpoint:map', placeRef: 'twinfile/place/car:0.0.0' },
          ],
        },
      ],
      touchpointCatalog: touchpointCatalogFromWire({
        touchpoints: [{ id: 'touchpoint:map', locus: 'physical', placeRef: 'twinfile/place/wrong:0.0.0' }],
      }),
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 5,
      planningHorizonDays: 42,
    });

    const row = result.episodeArc.touchpointSchedule.find((e) => e.touchpointId === 'touchpoint:map');
    expect(row?.placeRef).toBe('twinfile/place/car:0.0.0');
  });
});
