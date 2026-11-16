import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';

import { testCatalogRoots } from '../../core/test/catalog-test-roots.js';
import {
  buildTwinfile,
  loadTwinfileStrict,
} from '@doppler-group/twinfile-place';
import { twinHeadPath } from '@doppler-group/twinfile-core';

const { examplesRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));

function writePlace(dir: string, from: string, mixins: string[]): void {
  mkdirSync(join(dir, 'place'), { recursive: true });
  writeFileSync(
    twinHeadPath(dir),
    stringify({
      twinfile: 1,
      kind: 'place',
      id: 'mixin-probe',
      name: 'Mixin probe',
      version: '0.1.0',
      stability: 'example',
      from,
      with: mixins,
      layers: ['place/place.yaml'],
    }),
  );
  writeFileSync(join(dir, 'place/place.yaml'), stringify({ place: { name: 'Mixin probe', kind: 'probe', timezone: 'UTC' } }));
}

describe('place with: mixins', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'twin-mixins-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('composes mixin rows after the base', async () => {
    writePlace(dir, 'twinfile/base-linear:0.1.0', [
      'twinfile/mixin-assets:0.1.0',
      'twinfile/mixin-sensors:0.1.0',
    ]);
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    expect(built.ok, built.ok ? '' : JSON.stringify(built.errors)).toBe(true);
    if (!built.ok) return;

    const kinds = built.value.layers.map((layer) => `${layer.kind} ${layer.ref}`);
    expect(kinds[0]).toMatch(/^place from\/base-linear\//);
    expect(kinds.at(-1)).toBe('place place/place.yaml');
    const data = built.value.data as { assets?: { id: string }[]; sensors?: { id: string }[] };
    expect(data.assets?.map((row) => row.id)).toContain('starter-kiosk');
    expect(data.sensors?.map((row) => row.id)).toContain('starter-sensor');

    const strict = loadTwinfileStrict(dir, { examplesRoot });
    expect(strict.ok, strict.ok ? '' : JSON.stringify(strict.errors)).toBe(true);
  });

  it('rejects with: refs that are not mixins', async () => {
    writePlace(dir, 'twinfile/base-single-level:0.1.0', ['twinfile/base-campus:0.1.0']);
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.errors[0]?.message).toMatch(/with must reference mixin units/);
  });
});
