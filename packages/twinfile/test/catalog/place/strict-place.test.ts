import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { loadTwinfileStrict, strictCheckPlace } from '../../../src/catalog/place/check/strict-place.js';
import { loadTwinfile } from '@local-hosting/twinfile';
import { testExamplesRoot } from '../../../helpers/catalog-test-roots.js';
import { twinHeadPath } from '@local-hosting/twinfile';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

const plannedPlaces = readdirSync(examplesRoot).filter((name) => {
  if (name.startsWith('base-') || name.endsWith('-programme')) return false;
  const twinfile = twinHeadPath(join(examplesRoot, name));
  if (!statSync(twinfile, { throwIfNoEntry: false })?.isFile()) return false;
  const raw = readFileSync(twinfile, 'utf8');
  return raw.includes('bindings/');
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
      expect(strict.value.bindings).toBe(4);
    }
  });

  it.each(plannedPlaces)('%s strict plan satisfies event contract', (name) => {
    const placeRoot = join(examplesRoot, name);
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
      expect(result.value.strictBindings).toBe(4);
    }
  });

  it('rejects plan missing a required event role', () => {
    const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/strict-missing-role');
    const result = loadTwinfileStrict(fixtureRoot, { examplesRoot });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === 'E_ROLE_MISSING')).toBe(true);
    }
  });
});
