import { describe, expect, it } from 'vitest';

import { PlaceRefSchema } from '../../src/contract/character/journey/place.schema.js';

describe('PlaceRefSchema', () => {
  it('carries an optional Twinfile placeRef instead of venueId', () => {
    const parsed = PlaceRefSchema.parse({ id: 'downtown', placeRef: 'twinfile/place/downtown:1.0.0' });
    expect(parsed.placeRef).toBe('twinfile/place/downtown:1.0.0');
    expect(parsed).not.toHaveProperty('venueId');
  });

  it('rejects a placeRef that is not a Twinfile ref', () => {
    expect(() => PlaceRefSchema.parse({ id: 'downtown', placeRef: 'venue:downtown' })).toThrow();
  });
});
