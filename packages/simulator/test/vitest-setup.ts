import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerCatalogTwinfileResolver } from '@doppler-group/twinfile-core';

import { testCatalogRoots } from './test-examples-root.js';

// Same module instance as tests — register catalog ref resolution before any build.
const simulatorResolve = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/ref/catalog-twinfile-resolve.js',
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