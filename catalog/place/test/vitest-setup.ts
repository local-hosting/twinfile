import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerCatalogTwinfileResolver } from '@doppler-group/twinfile-core';

import { testCatalogRoots } from './test-examples-root.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot, simulatorRoot } = testCatalogRoots(testDir);

// Dynamic import: the simulator resolver lives outside this package and is test-only wiring.
const { resolveCatalogTwinfileRef } = await import(resolve(simulatorRoot, 'src/ref/catalog-twinfile-resolve.js'));
registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);

if (!process.env.TF_EXAMPLES_ROOT?.trim()) process.env.TF_EXAMPLES_ROOT = examplesRoot;
if (!process.env.TF_SIMULATOR_ROOT?.trim()) process.env.TF_SIMULATOR_ROOT = simulatorRoot;
