import { describe, expect, it } from 'vitest';

import { placeMountFromHostUnit } from '../../../src/contract/narrative/place/place-mount-from-host-unit.js';

describe('placeMountFromHostUnit', () => {
  it('strips placeRef from host-resolved wire', () => {
    const mount = placeMountFromHostUnit({
      placeRef: 'twinfile/shop:1.0.0',
      venueKey: 'venue:shop',
      title: 'Shop',
      spaceIds: ['space:floor'],
      geo: { lat: 1, lon: 2 },
    });
    expect(mount.venueKey).toBe('venue:shop');
    expect(mount.geo).toEqual({ lat: 1, lon: 2 });
    expect('placeRef' in mount).toBe(false);
  });
});
