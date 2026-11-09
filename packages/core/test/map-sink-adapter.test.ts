import { describe, expect, it } from 'vitest';

import { slicePlaceForMapSink } from '../src/map/map-sink-adapter.js';

describe('slicePlaceForMapSink', () => {
  const place = {
    spaces: [
      { id: 'hub' },
      { id: 'hub-ticket-hall' },
      { id: 'parking' },
    ],
  };

  it('returns full place for place:merged', () => {
    expect(slicePlaceForMapSink(place, 'place:merged')).toEqual(place);
  });

  it('filters building subtree for place:building', () => {
    const slice = slicePlaceForMapSink(place, 'place:building', { buildingAnchor: 'hub' });
    expect((slice.spaces as Array<{ id: string }>).map((row) => row.id)).toEqual(['hub', 'hub-ticket-hall']);
  });
});
