import { describe, expect, it } from 'vitest';

import { parseUrnTwinfile, urnTwinfile } from '../src/ref/urn-twinfile.js';

describe('urn:twinfile', () => {
  it('round-trips type, id, ver', () => {
    const urn = urnTwinfile('place', 'shop', '0.2.0');
    expect(urn).toBe('urn:twinfile:place:shop:0.2.0');
    expect(parseUrnTwinfile(urn)).toEqual({ type: 'place', id: 'shop', ver: '0.2.0' });
  });
});