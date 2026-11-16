import { describe, expect, it } from 'vitest';

import { resolvePhaseStarts } from '@doppler-group/twinfile-simulator';

describe('resolvePhaseStarts', () => {
  const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT6H', step: 'PT5M' };

  it('defaults release to t=0 when releaseAt is omitted', () => {
    const starts = resolvePhaseStarts({
      clock,
      events: [{ phases: ['notice', 'release'], args: { releaseAt: { type: 'time' } } }],
      resolvedArgs: {},
    });
    expect(starts.release).toBe(0);
    expect(starts.notice).toBeUndefined();
  });

  it('accepts duration offsets from starts_at', () => {
    const starts = resolvePhaseStarts({
      clock,
      events: [{ phases: ['release'], args: { releaseAt: { type: 'time' } } }],
      resolvedArgs: { releaseAt: 'PT1H' },
    });
    expect(starts.release).toBe(3600);
  });
});
