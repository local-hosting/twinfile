import { describe, expect, it } from 'vitest';

import {
  mergePlaceMountsByPlaceRef,
  minimalPlaceMount,
} from '../../../../../src/contract/narrative/place/minimal-place-mount.js';
import { placeMountFromPlaceRef } from '../../../../../src/contract/narrative/place/place-mount-from-place-ref.js';

describe('placeMountFromPlaceRef', () => {
  it('builds a geo mount with a synthesized placeRef', () => {
    const mount = placeMountFromPlaceRef({
      id: 'downtown',
      label: 'Downtown',
      lat: 40.7128,
      lon: -74.006,
      h3Cell: '8928308280fffff',
    });
    expect(mount.placeRef).toBe('twinfile/place/downtown:0.0.0');
    expect(mount.geo).toEqual({ lat: 40.7128, lon: -74.006 });
  });

  it('mergePlaceMountsByPlaceRef prefers richer layout over anchor', () => {
    const anchor = minimalPlaceMount({ placeRef: 'twinfile/place/shop:0.0.0', lat: 1, lon: 2 });
    const twinfile = {
      ...anchor,
      spaceIds: ['space:floor'],
    };
    const merged = mergePlaceMountsByPlaceRef([anchor, twinfile]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.spaceIds).toEqual(['space:floor']);
  });
});

describe('minimalPlaceMount', () => {
  it('allows id-only mounts', () => {
    const mount = minimalPlaceMount({ placeRef: 'twinfile/place/pop-up:0.0.0', title: 'Pop-up' });
    expect(mount.geo).toBeUndefined();
    expect(mount.spaceIds).toEqual([]);
  });
});
