import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'yaml';
import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '../src/load/load-twinfile.js';
import { parseModuleGraphFromTwinfile } from '../src/patch/module-graph-twinfile.js';
import { loadPatchModuleTypeCatalog } from '../src/patch/module-type-catalog.js';
import { projectPatchGraphForUi } from '../src/patch/project-patch-ui.js';
import type { PatchGraphV1 } from '../src/types/patch-graph.js';
import { testExamplesRoot } from './catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const examplesRoot = testExamplesRoot(importDir);

describe('projectPatchGraphForUi', () => {
  it('projects arena patch modules and wires', () => {
    const unitPath = join(examplesRoot, 'arena');
    const loaded = loadTwinfile(unitPath);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error('load failed');
    const patch = parseModuleGraphFromTwinfile(loaded.value.twinfile);
    if (!patch) throw new Error('no module graph');
    const catalog = loadPatchModuleTypeCatalog();
    const model = projectPatchGraphForUi(patch, catalog);
    expect(model.schema).toBe('twinfile.patch.ui.v1');
    expect(model.modules.length).toBe(7);
    const gtfs = model.modules.find((m) => m.id === 'gtfs');
    expect(gtfs?.outputs.some((p) => p.port === 'place')).toBe(true);
    expect(model.connections.length).toBe(3);
    expect(model.connections.some((c) => c.wire === 'place:merged')).toBe(true);
  });

  it('accepts catalog passed from browser (no fs)', () => {
    const snippet = `
processors:
  - id: map
    type: twinfile/mod.map-sink@0.1.0
`;
    const doc = yaml.parse(snippet) as Record<string, unknown>;
    const patch = parseModuleGraphFromTwinfile(doc);
    if (!patch) throw new Error('no processors');
    const catalog = {
      'twinfile/mod.map-sink@0.1.0': {
        ports: { in: { direction: 'in' as const, wire: 'place:merged' } },
      },
    };
    const model = projectPatchGraphForUi(patch, catalog);
    expect(model.modules[0]?.inputs[0]?.wire).toBe('place:merged');
  });
});
