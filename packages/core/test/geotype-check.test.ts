import { describe, expect, it } from 'vitest';

import { checkGeotypeTwinfile } from '../src/check/geotype-check.js';

describe('checkGeotypeTwinfile', () => {
  it('accepts a known geotype.primary', () => {
    expect(
      checkGeotypeTwinfile({
        kind: 'place',
        geotype: { primary: 'airport' },
      }),
    ).toBeNull();
  });

  it('rejects an unknown geotype.primary', () => {
    const err = checkGeotypeTwinfile({
      kind: 'place',
      geotype: { primary: 'town_hall' },
    });
    expect(err?.code).toBe('E_GEOTYPE_UNKNOWN');
  });

  it('allows missing geotype when not published', () => {
    expect(checkGeotypeTwinfile({ kind: 'place' })).toBeNull();
  });

  it('requires geotype.primary when published', () => {
    const err = checkGeotypeTwinfile({ kind: 'place' }, 'Twinfile.yaml', {
      published: true,
    });
    expect(err?.code).toBe('E_GEOTYPE_MISSING');
  });

  it('skips non-place twinfiles', () => {
    expect(
      checkGeotypeTwinfile(
        { kind: 'story' },
        undefined,
        { published: true },
      ),
    ).toBeNull();
  });
});
