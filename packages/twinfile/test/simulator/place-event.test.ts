import { describe, expect, it } from 'vitest';

import {
  createEventCatalog,
  definePlaceEvent,
  placeEventRef,
  placeEventRequestMessages,
  resolveRegisteredPlaceEventRef,
  registerEventCatalog,
  clearRegisteredEventCatalogs,
} from '../../src/simulator/index.js'; // package entry under test

describe('place events', () => {
  it('default request emits twin:event', () => {
    const earthquake = definePlaceEvent({
      id: 'earthquake',
      name: 'Earthquake',
      phases: ['alert', 'shaking'],
    });
    const messages = placeEventRequestMessages(earthquake, {
      type: 'earthquake',
      phase: 'shaking',
      edge: 'enter',
      pulse: 'fast',
    });
    expect(messages.ok).toBe(true);
    if (!messages.ok) return;
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]!.wire).toBe('twin:event');
    expect(messages.value[0]!.payload.phase).toBe('shaking');
  });

  it('catalog resolves twinfile refs', () => {
    clearRegisteredEventCatalogs();
    const catalog = createEventCatalog().register(
      definePlaceEvent({ id: 'flood', name: 'Flood', phases: ['advisory'] }),
    );
    registerEventCatalog(catalog);
  const hit = resolveRegisteredPlaceEventRef('twinfile/event/flood:1.0.0');
    expect(hit?.id).toBe('flood');
    clearRegisteredEventCatalogs();
  });

  it('placeEventRef uses catalog kind', () => {
    const gameDay = definePlaceEvent({
      id: 'arena-game-day',
      name: 'Game day',
      catalogKind: 'event',
      timetable: { kickoff: 'PT0S' },
    });
    expect(placeEventRef(gameDay)).toBe('twinfile/event/arena-game-day:1.0.0');
  });
});
