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
const { examplesRoot, simulatorRoot } = testCatalogRoots(importDir);
const scenarioRoot = goldenSceneRunDir(importDir, 'arena-storm-at-halftime');

describe('composeScenarioLayers', () => {
  it('orders place, event, situation, and args layers', () => {
    const loaded = loadRunUnit(scenarioRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const composed = composeScenarioLayers(loaded.value, { examplesRoot, simulatorRoot });
    expect(composed.ok).toBe(true);
    if (!composed.ok) return;

    expect(composed.value.layers.length).toBeGreaterThan(4);
    expect(composed.value.layers.some((l) => l.ref === 'scenario/args')).toBe(true);
    expect(composed.value.resolvedArgs.warningAt).toBe(3900);
    expect(composed.value.events).toHaveLength(1);
    expect(composed.value.situations).toHaveLength(1);
  });
});

describe('buildTwinfile scenario', () => {
  it('builds storm-at-halftime bundle', async () => {
    cleanup();
    try {
      const result = await buildTwinfile(scenarioRoot, { examplesRoot, simulatorRoot, writeLock: false });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.events?.length).toBe(1);
      expect(result.value.situations?.length).toBe(1);
      expect(result.value.layers.some((l) => l.kind === 'binding')).toBe(true);
    } finally {
      cleanup();
    }
  });
});

function cleanup(): void {
  rmSync(twinLockPath(scenarioRoot), { force: true });
}
