import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
  composeScenarioLayers,
} from '@local-hosting/twinfile-place';
import {
  loadRunUnit,
} from '@local-hosting/twinfile-core';
import { goldenSceneRunDir, testCatalogRoots } from '../../core/test/catalog-test-roots.js';
import { twinLockPath } from '@local-hosting/twinfile-core';

const importDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot } = testCatalogRoots(importDir);
const scenarioRoot = goldenSceneRunDir(importDir, 'arena-storm-at-halftime');

describe('composeScenarioLayers', () => {
  it('orders place, event, and args layers', () => {
    const loaded = loadRunUnit(scenarioRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const composed = composeScenarioLayers(loaded.value, { examplesRoot });
    expect(composed.ok).toBe(true);
    if (!composed.ok) return;

    expect(composed.value.layers.length).toBeGreaterThan(4);
    expect(composed.value.layers.some((l) => l.ref === 'scenario/args')).toBe(true);
    expect(composed.value.resolvedArgs.warningAt).toBe(3900);
    expect(composed.value.events.map((row) => row.id)).toEqual(['arena-game-day', 'severe-weather']);
  });
});

describe('buildTwinfile scenario', () => {
  it('builds storm-at-halftime bundle', async () => {
    cleanup();
    try {
      const result = await buildTwinfile(scenarioRoot, { examplesRoot, writeLock: false });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.events?.length).toBe(2);
      expect(result.value.layers.some((l) => l.kind === 'binding')).toBe(true);
    } finally {
      cleanup();
    }
  });
});

function cleanup(): void {
  rmSync(twinLockPath(scenarioRoot), { force: true });
}
