import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLACE_ARCHETYPES } from '@doppler-group/geotypes';
import { stringify } from 'yaml';
import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '../src/load/load-twinfile.js';
import { placeBaseRefForArchetype } from '../src/ref/place-base-refs.js';
import { testExamplesRoot } from './test-examples-root.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

function baseDirForRef(ref: string): string {
  const name = ref.replace(/^twinfile\//, '').replace(/:.*$/, '');
  const flat = join(examplesRoot, name);
  const legacy = join(examplesRoot, 'bases', name);
  return statSync(flat, { throwIfNoEntry: false })?.isDirectory() ? flat : legacy;
}

function writePlaceUnit(dir: string, place: Record<string, unknown>, spaces: unknown[], levels?: unknown[]): void {
  mkdirSync(join(dir, 'place'), { recursive: true });
  const layers = ['place/place.yaml', ...(levels ? ['place/levels.yaml'] : []), 'place/spaces.yaml'];
  writeFileSync(
    join(dir, 'Twinfile.yaml'),
    stringify({
      twinfile: 1,
      kind: 'place',
      id: 'axes-probe',
      name: 'Axes probe',
      version: '0.1.0',
      stability: 'example',
      layers,
    }),
  );
  writeFileSync(join(dir, 'place/place.yaml'), stringify({ place: { timezone: 'UTC', ...place } }));
  writeFileSync(join(dir, 'place/spaces.yaml'), stringify({ spaces }));
  if (levels) writeFileSync(join(dir, 'place/levels.yaml'), stringify({ levels }));
}

function loadErrors(place: Record<string, unknown>, spaces: unknown[], levels?: unknown[]): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'twin-axes-'));
  try {
    writePlaceUnit(dir, place, spaces, levels);
    const loaded = loadTwinfile(dir);
    return loaded.ok ? [] : loaded.errors.map((e) => e.message);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('golden place bases', () => {
  it.each(PLACE_ARCHETYPES)('base for %s loads and passes its archetype rules', (archetype) => {
    const loaded = loadTwinfile(baseDirForRef(placeBaseRefForArchetype(archetype)));
    expect(loaded.ok, loaded.ok ? '' : JSON.stringify(loaded.errors)).toBe(true);
  });
});

describe('archetype axis rules', () => {
  it('requires a site anchor for open_area', () => {
    expect(loadErrors({ name: 'x', kind: 'x', archetype: 'open_area' }, [{ id: 'a', kind: 'zone' }])).toContain(
      'archetype open_area requires place.footprint or place.ext lat/lon',
    );
  });

  it('allows at most one level for flat archetypes', () => {
    const levels = [
      { id: 'one', name: 'One', ordinal: 0 },
      { id: 'two', name: 'Two', ordinal: 1 },
    ];
    expect(
      loadErrors({ name: 'x', kind: 'x', archetype: 'open_area', ext: { lat: 0, lon: 0 } }, [{ id: 'a', kind: 'zone' }], levels),
    ).toContain('archetype open_area allows at most one level');
  });
});
