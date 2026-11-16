import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildTwinfile } from '../src/build/build-twinfile.js';
import { mergePlaceFromTwinfile } from '../src/place/place-inherit.js';
import { loadTwinfile } from '@doppler-group/twinfile-core';
import { loadTwinfileStrict } from '../src/check/strict-place.js';
import { testExamplesRoot } from '../../../packages/core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('place from (DRY base)', () => {
  it('transit-hub-campus inherits base place and plans', async () => {
    const childRoot = join(examplesRoot, 'mobility-hub/campus');
    const strict = loadTwinfileStrict(childRoot, { examplesRoot });
    expect(strict.ok).toBe(true);
    if (!strict.ok) return;
    expect(strict.value.strictBindings).toBe(2);

    const merged = mergePlaceFromTwinfile(strict.value, { examplesRoot });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.value.spaces?.some((s) => s.id === 'hall-shelter')).toBe(false);
    expect(merged.value.spaces?.some((s) => s.id === 'transit-hub')).toBe(true);
    expect(merged.value.spaces?.some((s) => s.id === 'transit-hub-ticket-hall')).toBe(true);

    const built = await buildTwinfile(childRoot, {
      examplesRoot,
      writeLock: false,
                  noCache: true,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const place = built.value.data?.place as Record<string, unknown> | undefined;
    expect(place?.name).toBe('Mobility hub campus (extends base-campus)');
  });

  it('base-campus builds standalone', async () => {
    const root = join(examplesRoot, 'base-campus');
    const loaded = loadTwinfile(root);
    expect(loaded.ok).toBe(true);
    const built = await buildTwinfile(root, {
      examplesRoot,
      writeLock: false,
                  noCache: true,
    });
    expect(built.ok).toBe(true);
  });
});
