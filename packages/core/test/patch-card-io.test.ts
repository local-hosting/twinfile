import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '../src/load/load-twinfile.js';
import { parseModuleGraphFromTwinfile } from '../src/patch/module-graph-twinfile.js';
import { loadPatchModuleTypeCatalog } from '../src/patch/module-type-catalog.js';
import { patchModuleWireIo } from '../src/patch/patch-card-io.js';
import type { PatchGraphV1 } from '../src/types/patch-graph.js';
import { testExamplesRoot } from './test-examples-root.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('patchModuleWireIo', () => {
  it('building-scope shows wired outbound only, not place:merged / place:building ports', () => {
    const loaded = loadTwinfile(join(examplesRoot, 'arena'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const patch = parseModuleGraphFromTwinfile(loaded.value.twinfile);
    if (!patch) throw new Error('no module graph');
    const catalog = loadPatchModuleTypeCatalog();
    const scope = patchModuleWireIo('concourse-scope', patch, catalog);
    expect(scope.inputs).toEqual([]);
    expect(scope.outputs.map((r) => r.id)).toEqual(['map-concourse.building']);
    expect(scope.outputs.some((r) => r.kind === 'place:building')).toBe(true);
    const internal = patchModuleWireIo('concourse-scope', patch, catalog);
    expect(internal.inputs.some((r) => r.label.includes('place:merged'))).toBe(false);
  });
});
