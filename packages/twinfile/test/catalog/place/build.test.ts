import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { mergeObjects } from '@local-hosting/twinfile';
import { placeImageDigest, sha256Digest } from '@local-hosting/twinfile';
import { TwinfileBuilder } from '../../../src/catalog/place/build/twinfile-builder.js';
import { LayerCache } from '@local-hosting/twinfile';
import { RefResolver } from '@local-hosting/twinfile';

describe('merge', () => {
  it('replaces id arrays when mode is replace', () => {
    const base = { spaces: [{ id: 'a', kind: 'hall' }, { id: 'b', kind: 'hall' }] };
    const patch = { spaces: [{ id: 'c', kind: 'zone' }] };
    const out = mergeObjects(base, patch, { mode: 'replace' }) as { spaces: { id: string }[] };
    expect(out.spaces.map((s) => s.id)).toEqual(['c']);
  });

  it('merges id arrays by id', () => {
    const base = { items: [{ id: 'a', label: 'A' }] };
    const patch = { items: [{ id: 'a', label: 'B' }] };
    const out = mergeObjects(base, patch) as { items: { id: string; label: string }[] };
    expect(out.items[0]?.label).toBe('B');
  });
});

describe('digest', () => {
  it('is stable for unicode', () => {
    const a = sha256Digest({ title: 'café' });
    const b = sha256Digest({ title: 'café' });
    expect(a).toBe(b);
  });
});

describe('TwinfileBuilder', () => {
  it('builds `Place.digest`', () => {
    const builder = new TwinfileBuilder();
    const result = builder.build({
      layers: [{ ref: 'place/spaces.yaml', kind: 'place', patch: { spaces: [{ id: 'main', kind: 'zone' }] } }],
      meta: { name: 'shop', kind: 'place', version: '0.1.0' },
    });
    expect(result.digest.startsWith('sha256:')).toBe(true);
    expect(result.errors).toEqual([]);
    const again = placeImageDigest({
      meta: { name: 'shop', kind: 'place', version: '0.1.0' },
      place: result.place,
      layers: result.layers.map((l) => l.chain),
    });
    expect(again).toBe(result.digest);
  });

  it('keeps resolvedArgs when args layer is cache-hit', () => {
    const cacheRoot = mkdtempSync(join(tmpdir(), 'twinfile-layer-cache-'));
    const cache = new LayerCache({ root: cacheRoot, enabled: true });
    const layers = [
      { ref: 'place/spaces.yaml', kind: 'place' as const, patch: { spaces: [{ id: 'main' }] } },
      { ref: 'scenario/args', kind: 'args' as const, patch: { occupancy: 42 } },
    ];
    const builder = new TwinfileBuilder();
    const first = builder.build({ layers, layerCache: cache });
    expect(first.metaExtras.resolvedArgs).toEqual({ occupancy: 42 });

    const second = builder.build({ layers, layerCache: cache });
    expect(second.metaExtras.resolvedArgs).toEqual({ occupancy: 42 });
  });
});

describe('RefResolver', () => {
  it('expands short oci ref', () => {
    const resolver = new RefResolver();
    const resolved = resolver.resolve('twinfile/arena:1.2.0');
    expect(resolved.name).toBe('arena');
    expect(resolved.tag).toBe('1.2.0');
  });
});

describe('TwinfileRef', () => {
  it('validates short refs', async () => {
    const { isTwinfileRef } = await import('@local-hosting/twinfile');
    expect(isTwinfileRef('twinfile/shop:0.1.0')).toBe(true);
    expect(isTwinfileRef('twinfile/arena:1.2')).toBe(true);
    expect(isTwinfileRef('twinfile/arena-game-day:1')).toBe(true);
    expect(isTwinfileRef('twinfile/scenario/arena-storm-at-halftime:1.0.0')).toBe(true);
    expect(isTwinfileRef('twinfile/place/arena:1.2.0')).toBe(true);
    expect(
      isTwinfileRef(
        'oci:ghcr.io/local-hosting/twinfile/arena:1.2@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
    ).toBe(true);
    expect(isTwinfileRef('venue:shop')).toBe(false);
  });
});
