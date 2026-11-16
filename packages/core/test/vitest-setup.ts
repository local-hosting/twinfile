import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerCatalogTwinfileResolver } from '../src/ref/catalog-twinfile-hook.js';
import { registerPlaceLoadHooks } from '../src/load/place-load-hooks.js';
import { testCatalogRoots } from './test-examples-root.js';

const { checkPlaceArchetype } = await import('@doppler-group/twinfile-place/check/place-archetype.js');
registerPlaceLoadHooks({ checkPlaceArchetype });

// Register on the same `@doppler-group/twinfile-core` module instance tests import from `src/` (not simulator's dist core).
const simulatorResolve = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../simulator/src/ref/catalog-twinfile-resolve.js',
);
const { resolveCatalogTwinfileRef } = await import(simulatorResolve);
registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);

const testDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot, simulatorRoot } = testCatalogRoots(testDir);
if (!process.env.TF_EXAMPLES_ROOT?.trim()) {
  process.env.TF_EXAMPLES_ROOT = examplesRoot;
}
if (!process.env.TF_SIMULATOR_ROOT?.trim()) {
  process.env.TF_SIMULATOR_ROOT = simulatorRoot;
}
