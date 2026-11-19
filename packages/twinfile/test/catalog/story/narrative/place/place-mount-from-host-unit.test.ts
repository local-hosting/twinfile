import { describe, expect, it } from 'vitest';

import { placeMountFromHostUnit } from '../../../../../src/contract/narrative/place/place-mount-from-host-unit.js';

describe('placeMountFromHostUnit', () => {
  it('keeps the host-resolved placeRef as the mount key', () => {
    const mount = placeMountFromHostUnit({
      placeRef: 'twinfile/shop:1.0.0',
      title: 'Shop',
      spaceIds: ['space:floor'],
      geo: { lat: 1, lon: 2 },
    });
    expect(mount.placeRef).toBe('twinfile/shop:1.0.0');
    expect(mount.geo).toEqual({ lat: 1, lon: 2 });
  });
});
