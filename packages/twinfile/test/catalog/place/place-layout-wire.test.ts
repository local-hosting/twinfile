import { describe, expect, it } from 'vitest';

import { placeMountFromJson, placeMountToJson } from '../../../src/place/place-mount-json.js';
import { placeLayoutFromJson, placeLayoutToAxmContribution } from '../../../src/mounts/place-layout-json.js';
import { placeMountFromPlaceLayout } from '../../../src/mounts/place-mount-from-layout-wire.js';
import { placeMountToPlaceLayout } from '../../../src/mounts/place-mount-to-layout-wire.js';

const shopMount = {
  placeRef: 'twinfile/shop:0.2.0',
  title: 'Shop',
  spaceIds: ['space:entry', 'space:aisle'],
};

describe('placeMountFromJson', () => {
  it('round-trips a mount keyed by placeRef', () => {
    const mount = placeMountFromJson(placeMountToJson(placeMountFromJson(shopMount)));
    expect(mount.placeRef).toBe('twinfile/shop:0.2.0');
    expect(mount.defaultSpaceId).toBe('space:entry');
  });

  it('rejects mounts without a valid placeRef', () => {
    const { placeRef: _omit, ...rest } = shopMount;
    expect(() => placeMountFromJson({ ...rest, venueKey: 'venue:shop' })).toThrow(/placeRef/);
    expect(() => placeMountFromJson({ ...shopMount, placeRef: 'venue:shop' })).toThrow(/placeRef/);
  });
});

describe('place layout wire', () => {
  it('reads a layout keyed by placeRef and contributes it to AXM', () => {
    const layout = placeLayoutFromJson({
      placeRef: 'twinfile/place/shop:0.2.0',
      title: 'Shop',
      spaces: [{ id: 'space:entry', label: 'Entry' }],
    });
    expect(layout.placeRef).toBe('twinfile/place/shop:0.2.0');
    expect(placeLayoutToAxmContribution(layout).placeRef).toBe('twinfile/place/shop:0.2.0');
  });

  it('round-trips a place mount through the layout wire', () => {
    const mount = placeMountFromPlaceLayout(placeMountToPlaceLayout(placeMountFromJson(shopMount)));
    expect(mount.placeRef).toBe('twinfile/shop:0.2.0');
    expect(mount.spaceIds).toEqual(['space:entry', 'space:aisle']);
  });

  it('rejects layouts without placeRef', () => {
    expect(() => placeLayoutFromJson({ id: 'venue:shop', title: 'Shop' })).toThrow(/placeRef/);
  });
});
