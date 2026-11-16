import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '@doppler-group/twinfile-core';
import { placeMountFromResolved } from '../src/place/place-mount.js';
import { resolveExamplePlace } from '@doppler-group/twinfile-core';
import { testExamplesRoot } from '../../../packages/core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('place layout and visit moments', () => {
  it('loads shop place archetype', () => {
    const loaded = loadTwinfile(join(examplesRoot, 'shop'));
    expect(loaded.ok).toBe(true);
  });

  it('place mount exposes visit moment ids from expo', () => {
    const resolved = resolveExamplePlace('twinfile/expo:0.2.0', { examplesRoot });
    const mount = placeMountFromResolved(resolved);
    expect(mount.visitMomentIds?.length).toBeGreaterThan(0);
    expect(mount.defaultVisitMomentId).toBe(mount.visitMomentIds?.[0]);
  });
});
