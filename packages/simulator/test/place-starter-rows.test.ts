import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';

import { testCatalogRoots } from '../../core/test/catalog-test-roots.js';
import {
  buildTwinfile,
  loadTwinfileStrict,
} from '@local-hosting/twinfile-place';
import { twinHeadPath } from '@local-hosting/twinfile-core';

const { examplesRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));

function writePlace(dir: string, from: string, extra: Record<string, unknown>[], head: Record<string, unknown> = {}): void {
  writeFileSync(
    twinHeadPath(dir),
    stringify({
      twinfile: 2,
      kind: 'place',
      id: 'starter-probe',
      name: 'Starter probe',
      version: '0.1.0',
      stability: 'example',
      from,
      ...head,
      steps: [{ place: { name: 'Starter probe', kind: 'probe', timezone: 'UTC' } }, ...extra],
    }),
  );
}

describe('place starter rows', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'twin-starter-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('composes starter assets and sensors after the base', async () => {
    writePlace(dir, 'twinfile/base-linear:0.1.0', [
      { assets: [{ id: 'starter-kiosk', name: 'Starter kiosk', kind: 'kiosk', state: 'active' }] },
      { sensors: [{ id: 'starter-sensor', name: 'Starter sensor', observes: 'occupancy' }] },
    ]);
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    expect(built.ok, built.ok ? '' : JSON.stringify(built.errors)).toBe(true);
    if (!built.ok) return;

    const kinds = built.value.layers.map((layer) => `${layer.kind} ${layer.ref}`);
    expect(kinds[0]).toMatch(/^place from\/base-linear\//);
    const data = built.value.data as { assets?: { id: string }[]; sensors?: { id: string }[] };
    expect(data.assets?.map((row) => row.id)).toContain('starter-kiosk');
    expect(data.sensors?.map((row) => row.id)).toContain('starter-sensor');

    const strict = loadTwinfileStrict(dir, { examplesRoot });
    expect(strict.ok, strict.ok ? '' : JSON.stringify(strict.errors)).toBe(true);
  });

  it('rejects with: mixins', async () => {
    writePlace(dir, 'twinfile/base-single-level:0.1.0', [], { with: ['twinfile/mixin-assets:0.1.0'] });
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    expect(built.ok).toBe(false);
  });
});
