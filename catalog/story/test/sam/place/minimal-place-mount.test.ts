import { describe, expect, it } from 'vitest';

import {
  mergePlaceMountsByVenueKey,
  minimalPlaceMount,
} from '../../../src/contract/narrative/place/minimal-place-mount.js';
import { placeMountFromPlaceRef } from '../../../src/contract/narrative/place/place-mount-from-place-ref.js';

describe('placeMountFromPlaceRef', () => {
  it('builds a geo mount without twinfile placeRef', () => {
    const mount = placeMountFromPlaceRef({
      id: 'downtown',
      label: 'Downtown',
      lat: 40.7128,
      lon: -74.006,
      h3Cell: '8928308280fffff',
    });
    expect(mount).not.toHaveProperty('placeRef');
    expect(mount.venueKey).toBe('venue:downtown');
    expect(mount.geo).toEqual({ lat: 40.7128, lon: -74.006 });
  });

  it('mergePlaceMountsByVenueKey prefers richer layout over anchor', () => {
    const anchor = minimalPlaceMount({ venueKey: 'venue:shop', lat: 1, lon: 2 });
    const twinfile = {
      ...anchor,
      spaceIds: ['space:floor'],
    };
    const merged = mergePlaceMountsByVenueKey([anchor, twinfile]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.spaceIds).toEqual(['space:floor']);
  });
});

describe('minimalPlaceMount', () => {
  it('allows id-only mounts', () => {
    const mount = minimalPlaceMount({ venueKey: 'venue:pop-up', title: 'Pop-up' });
    expect(mount.geo).toBeUndefined();
    expect(mount.spaceIds).toEqual([]);
  });
});
