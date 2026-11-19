import { describe, expect, it } from 'vitest';

import { createClock } from '@local-hosting/twinfile/simulator';
import {
  formatLocalDateTime,
  parseLocalDateTime,
  resolveScrubT,
  snapTToClock,
  tFromInstant,
} from '@local-hosting/twinfile/simulator';

const clockSpec = {
  starts_at: '2026-06-12T09:00:00-04:00',
  duration: 'PT6H',
  step: 'PT5M',
};

describe('snapTToClock', () => {
  it('snaps to the clock grid and clamps to duration', () => {
    const clock = createClock(clockSpec);
    expect(snapTToClock(127, clock)).toBe(0);
    expect(snapTToClock(450, clock)).toBe(600);
    expect(snapTToClock(999_999, clock)).toBe(21_600);
    expect(snapTToClock(-5, clock)).toBe(0);
  });
});

describe('resolveScrubT', () => {
  it('resolves instants and local wall times in the place timezone', () => {
    const tFromAt = resolveScrubT(clockSpec, { at: '2026-06-12T10:00:00-04:00' }, 'America/New_York');
    expect(tFromAt).toBe(3600);

    const ms = parseLocalDateTime('2026-06-12T10:00', 'America/New_York');
    const tLocal = resolveScrubT(clockSpec, { localAt: '2026-06-12T10:00' }, 'America/New_York');
    expect(tLocal).toBe((ms - Date.parse(clockSpec.starts_at)) / 1000);
  });

  it('round-trips local datetime formatting', () => {
    const startMs = Date.parse(clockSpec.starts_at);
    const formatted = formatLocalDateTime(startMs, 'America/New_York');
    expect(formatted).toBe('2026-06-12T09:00');
    expect(tFromInstant('2026-06-12T09:00:00-04:00', clockSpec)).toBe(0);
  });
});
