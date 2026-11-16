import { describe, expect, it } from 'vitest';

import { flatTwinfileRef, parseTwinfileRef } from '../src/types/twinfile-ref.js';

describe('flatTwinfileRef', () => {
  it('strips typed kind segment for catalog keys', () => {
    expect(flatTwinfileRef('twinfile/situation/severe-weather:1.0.0')).toBe(
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
