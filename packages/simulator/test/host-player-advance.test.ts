import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';


import { twinfilePlayerAdvance } from '@local-hosting/twinfile-simulator/host';

import { goldenSceneRun, testCatalogRoots } from '../../core/test/catalog-test-roots.js';
import {
  buildTwinfile,
} from '@local-hosting/twinfile-place';

const testDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot } = testCatalogRoots(testDir);

describe('host session advance', () => {
  it('moves playhead and records clock bus notes', async () => {
    const dir = goldenSceneRun(dirname(fileURLToPath(import.meta.url)), 'storm-at-halftime');
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    expect(built.ok, built.ok ? '' : JSON.stringify(built.errors)).toBe(true);
    if (!built.ok) return;

    const moved = twinfilePlayerAdvance(built.value, { fromT: 0, toT: 300, publish: false }, 1);
    expect(moved.playheadT).toBe(300);
    expect(moved.clockEvents?.some((row) => row.type === 'note')).toBe(true);
  });
});
