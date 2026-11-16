import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { loadTwinfileStrict, strictCheckPlace } from '../src/check/strict-place.js';
import { loadTwinfile } from '@doppler-group/twinfile-core';
import { testExamplesRoot } from '../../../packages/core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

const plannedPlaces = readdirSync(examplesRoot).filter((name) => {
  if (name.startsWith('base-') || name.startsWith('mixin-') || name.endsWith('-programme')) return false;
  const twinfile = join(examplesRoot, name, 'Twinfile.yaml');
  if (!statSync(twinfile, { throwIfNoEntry: false })?.isFile()) return false;
  const raw = readFileSync(twinfile, 'utf8');
  return raw.includes('plans/');
});

describe('strictCheckPlace', () => {
  it('arena severe-weather plan satisfies contract', () => {
    const arenaRoot = join(examplesRoot, 'arena');
    const loaded = loadTwinfile(arenaRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const strict = strictCheckPlace(loaded.value, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (strict.ok) {
      expect(strict.value.bindings).toBe(2);
    }
  });

  it.each(plannedPlaces)('%s strict plan satisfies situation contract', (name) => {
    const placeRoot = join(siteRoot, name);
    const result = loadTwinfileStrict(placeRoot, { examplesRoot });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.strictBindings).toBeGreaterThan(0);
    }
  });

  it('loadTwinfileStrict loads arena end-to-end', () => {
    const result = loadTwinfileStrict(join(examplesRoot, 'arena'), { examplesRoot });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.strictBindings).toBe(2);
    }
  });

  it('rejects plan missing a required situation role', () => {
    const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/strict-missing-role');
    const result = loadTwinfileStrict(fixtureRoot, { examplesRoot });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === 'E_ROLE_MISSING')).toBe(true);
    }
  });
});
