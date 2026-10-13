import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';

import {
  buildTwinfile,
  composePlace,
  listPlaceEventBindings,
  loadTwinfileStrict,
  mergePlaceFromTwinfile,
} from '@local-hosting/twinfile/place';
import {
  loadTwinfile,
  type Result,
  type EventBindingDoc,
} from '@local-hosting/twinfile';
import { formatTwinfilePath } from '@local-hosting/twinfile/cli';
import { testCatalogRoots } from '../helpers/catalog-test-roots.js';
import { twinHeadPath } from '@local-hosting/twinfile';

const { examplesRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));

function unwrapBindings(result: Result<EventBindingDoc[]>): EventBindingDoc[] {
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  return result.value;
}

function writeUnit(dir: string, patches: Record<string, unknown>[]): void {
  mkdirSync(dir, { recursive: true });
  const id = dir.split('/').pop()!.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  writeFileSync(
    twinHeadPath(dir),
    stringify({
      twinfile: 2,
      kind: 'place',
      id,
      name: id,
      version: '0.1.0',
      stability: 'example',
      steps: patches,
    }),
  );
}

describe('place copy: nested building units (RFC 0009)', () => {
  it('airport copies terminal-a building, which copies its airside floor', async () => {
    const root = join(examplesRoot, 'airport');
    const strict = loadTwinfileStrict(root, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (!strict.ok) return;

    const merged = mergePlaceFromTwinfile(strict.value, { examplesRoot });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;

    expect(merged.value.spaces?.some((s) => s.id === 'terminal-a-concourse')).toBe(true);
    expect(merged.value.spaces?.some((s) => s.id === 'terminal-a-airside-hold-room')).toBe(true);
    expect(merged.value.assets?.some((a) => a.id === 'terminal-a-board-departures')).toBe(true);
    const concourse = merged.value.spaces?.find((s) => s.id === 'terminal-a-concourse');
    expect(concourse?.parent).toBe('terminal-a');

    const built = await buildTwinfile(root, {
      examplesRoot,
      writeLock: false,
                  noCache: true,
    });
    expect(built.ok).toBe(true);
  });

  it('arena copies concourse building', () => {
    const root = join(examplesRoot, 'arena');
    const strict = loadTwinfileStrict(root, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (!strict.ok) return;
    const merged = mergePlaceFromTwinfile(strict.value, { examplesRoot });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.value.spaces?.some((s) => s.id === 'concourse-lower')).toBe(true);
    expect(merged.value.spaces?.some((s) => s.id === 'concourse-tunnel-north')).toBe(true);
    const lower = merged.value.spaces?.find((s) => s.id === 'concourse-lower');
    expect(lower?.parent).toBe('concourse');
  });

  it('port copies warehouse building', () => {
    const root = join(examplesRoot, 'port');
    const strict = loadTwinfileStrict(root, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (!strict.ok) return;
    const merged = mergePlaceFromTwinfile(strict.value, { examplesRoot });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.value.spaces?.some((s) => s.id === 'warehouse-main')).toBe(true);
  });

  it('rejects copy into a space no earlier patch declares', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-copy-'));
    writeUnit(join(dir, 'parts', 'wing'), [{ place: { name: 'Wing', kind: 'campus', timezone: 'UTC' } }, { spaces: [{ id: 'hall', kind: 'room' }] }]);
    writeUnit(dir, [
      { place: { name: 'Site', kind: 'campus', timezone: 'UTC' } },
      { spaces: [{ id: 'east', kind: 'room' }] },
      { copy: './parts/wing', into: 'missing' },
    ]);
    const loaded = loadTwinfile(dir);
    expect(loaded.ok).toBe(false);
    if (!loaded.ok) expect(loaded.errors[0]?.message).toContain('no space "missing"');
    rmSync(dir, { recursive: true });
  });

  it('copies a nested unit into an anchor with the default prefix', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-copy-'));
    writeUnit(join(dir, 'parts', 'wing'), [{ place: { name: 'Wing', kind: 'campus', timezone: 'UTC' } }, { spaces: [{ id: 'hall', kind: 'room' }] }]);
    writeUnit(dir, [
      { place: { name: 'Site', kind: 'campus', timezone: 'UTC' } },
      { spaces: [{ id: 'east', kind: 'room' }] },
      { copy: './parts/wing', into: 'east' },
    ]);
    const loaded = loadTwinfile(dir);
    expect(loaded.ok ? [] : loaded.errors).toEqual([]);
    if (!loaded.ok) return;
    const merged = mergePlaceFromTwinfile(loaded.value);
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.value.place?.name).toBe('Site');
    expect(merged.value.spaces?.find((s) => s.id === 'east-hall')?.parent).toBe('east');
    rmSync(dir, { recursive: true });
  });

  it('fails load when a ./ copy has no twin head', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-copy-'));
    writeUnit(dir, [{ place: { name: 'Site', kind: 'campus', timezone: 'UTC' } }, { copy: './nowhere' }]);
    const loaded = loadTwinfile(dir);
    expect(loaded.ok).toBe(false);
    if (!loaded.ok) expect(loaded.errors[0]?.message).toContain('./nowhere');
    rmSync(dir, { recursive: true });
  });

  it('--upgrade=2 keeps the same place, axes, and plans', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'twin-upgrade-'));
    const dir = join(tmp, 'shop');
    try {
      const source = join(examplesRoot, 'shop');
      cpSync(source, dir, { recursive: true });
      const options = { examplesRoot };
      const before = loadTwinfile(source);
      expect(before.ok).toBe(true);
      expect(formatTwinfilePath(twinHeadPath(dir), { upgrade: 2 })).toBe(0);
      const after = loadTwinfile(dir);
      expect(after.ok ? [] : after.errors).toEqual([]);
      if (!before.ok || !after.ok) return;

      const v1 = composePlace(before.value, options);
      const v2 = composePlace(after.value, options);
      expect(v1.ok && v2.ok).toBe(true);
      if (!v1.ok || !v2.ok) return;
      expect(v2.value.place).toEqual(v1.value.place);
      expect(v2.value.axes).toEqual(v1.value.axes);
      const planFor = (unit: typeof before.value) =>
        unwrapBindings(listPlaceEventBindings(unit, options)).map((row) => row.doc.for).sort();
      expect(planFor(after.value)).toEqual(planFor(before.value));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('expo copies opportunity pavilion building', () => {
    const root = join(examplesRoot, 'expo');
    const strict = loadTwinfileStrict(root, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (!strict.ok) return;
    const merged = mergePlaceFromTwinfile(strict.value, { examplesRoot });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.value.spaces?.some((s) => s.id === 'pavilion-opportunity-gallery')).toBe(true);
    const gallery = merged.value.spaces?.find((s) => s.id === 'pavilion-opportunity-gallery');
    expect(gallery?.parent).toBe('pavilion-opportunity');
  });
});
