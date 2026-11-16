import { describe, expect, it } from 'vitest';

import { snapPlayheadT } from '@doppler-group/twinfile-simulator';

describe('snapPlayheadT', () => {
  const meta = { durationS: 100, stepS: 5 };

  it('snaps to grid and clamps', () => {
    expect(snapPlayheadT(7, meta)).toBe(5);
    expect(snapPlayheadT(102, meta)).toBe(100);
    expect(snapPlayheadT(-3, meta)).toBe(0);
  });
});
