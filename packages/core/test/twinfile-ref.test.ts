import { describe, expect, it } from 'vitest';

import {
  flatTwinfileRef,
  parseTwinfileRef,
  placeRefForName,
  placeRefIdentity,
  samePlaceRef,
} from '../src/types/twinfile-ref.js';

describe('placeRefIdentity', () => {
  it('treats kindless refs as place and ignores tag and digest', () => {
    expect(placeRefIdentity('twinfile/arena:1.2.0')).toBe('place/arena');
    expect(
      placeRefIdentity(`oci:ghcr.io/twinfile/place/arena:2.0.0@sha256:${'a'.repeat(64)}`),
    ).toBe('place/arena');
  });

  it('keeps non-place kinds and rejects non-refs', () => {
    expect(placeRefIdentity('twinfile/event/arena:1.0.0')).toBe('event/arena');
    expect(placeRefIdentity('venue:arena')).toBeUndefined();
  });
});

describe('samePlaceRef', () => {
  it('matches on kind and name across tags', () => {
    expect(samePlaceRef('twinfile/arena:1.2.0', 'twinfile/place/arena:2.0.0')).toBe(true);
    expect(samePlaceRef('twinfile/arena:1.2.0', 'twinfile/event/arena:1.2.0')).toBe(false);
    expect(samePlaceRef('twinfile/arena:1.2.0', 'twinfile/shop:1.2.0')).toBe(false);
  });
});

describe('placeRefForName', () => {
  it('synthesizes a typed place ref from a free-form id', () => {
    expect(placeRefForName('Geo Anchor')).toBe('twinfile/place/geo-anchor:0.0.0');
    expect(placeRefForName('urban-curbside', '1.0.0')).toBe('twinfile/place/urban-curbside:1.0.0');
  });
});

describe('flatTwinfileRef', () => {
  it('strips typed kind segment for catalog keys', () => {
    expect(flatTwinfileRef('twinfile/event/severe-weather:1.0.0')).toBe(
      'twinfile/severe-weather:1.0.0',
    );
    expect(flatTwinfileRef('twinfile/event/arena-game-day:1.0.0')).toBe('twinfile/arena-game-day:1.0.0');
  });

  it('parseTwinfileRef reads kind', () => {
    const parsed = parseTwinfileRef('twinfile/scenario/arena-storm-at-halftime:1.0.0');
    expect(parsed?.kind).toBe('scenario');
    expect(parsed?.name).toBe('arena-storm-at-halftime');
  });
});
