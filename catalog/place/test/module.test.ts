import { describe, expect, it } from 'vitest';

import { kind, module } from '../src/index.js';

describe('@local-hosting/twinfile-place', () => {
  it('exports the place module', () => {
    expect(kind).toBe('place');
    expect(module.kind).toBe('place');
  });

  it('accepts place heads only', () => {
    expect(module.parse({ kind: 'place', id: 'shop' }).ok).toBe(true);
    expect(module.parse({ kind: 'mixin', id: 'decor' }).ok).toBe(false);
    expect(module.parse({ kind: 'story', id: 'shop' }).ok).toBe(false);
  });

  it('round-trips the place wire', () => {
    const wire = { meta: { id: 'shop' }, place: { spaces: [] }, digest: 'sha256:abc' };
    expect(module.fromJSON(module.toJSON(wire))).toEqual({ ok: true, value: wire });
  });
});
