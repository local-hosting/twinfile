import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildTwinfile } from '../src/build/build-twinfile.js';
import { readTwinfileLock } from '@doppler-group/twinfile-core';
import { loadTwinfile } from '@doppler-group/twinfile-core';
import { testExamplesRoot } from '../../../packages/core/test/catalog-test-roots.js';
import { twinLockPath } from '@doppler-group/twinfile-core';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));
const arenaRoot = join(examplesRoot, 'arena');

function cleanupArenaLock(): void {
  rmSync(twinLockPath(arenaRoot), { force: true });
}

describe('buildTwinfile', () => {
  it('builds arena place with image digest and lock', async () => {
    cleanupArenaLock();
    try {
      const result = await buildTwinfile(arenaRoot);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(result.value.layers.length).toBe(12);
      expect(result.value.refKey).toBe('twinfile/arena:1.2.0');

      const lock = readTwinfileLock(arenaRoot);
      expect(lock.ok).toBe(true);
      if (lock.ok && lock.value) {
        expect(lock.value.refs['twinfile/arena:1.2.0']?.layers?.length).toBe(12);
      }
    } finally {
      cleanupArenaLock();
    }
  });

  it('frozen rejects when lock missing', async () => {
    cleanupArenaLock();
    const frozen = await buildTwinfile(arenaRoot, { frozen: true, writeLock: false });
    expect(frozen.ok).toBe(false);
    if (!frozen.ok) {
      expect(frozen.errors.some((e) => e.code === 'E_LOCK_DRIFT')).toBe(true);
    }
  });

  it('frozen passes after lock written', async () => {
    cleanupArenaLock();
    try {
      const built = await buildTwinfile(arenaRoot, { writeLock: true });
      expect(built.ok).toBe(true);
      if (!built.ok) return;

      const frozen = await buildTwinfile(arenaRoot, { frozen: true, writeLock: false });
      expect(frozen.ok).toBe(true);
    } finally {
      cleanupArenaLock();
    }
  });
});

describe('loadTwinfile + build', () => {
  it('arena loads before build', () => {
    expect(loadTwinfile(arenaRoot).ok).toBe(true);
  });
});
