import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerCatalogTwinfileResolver } from '@doppler-group/twinfile-core';

// Same module instance as tests — register catalog ref resolution before any build.
const simulatorResolve = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/ref/catalog-twinfile-resolve.js',
);
const { resolveCatalogTwinfileRef } = await import(simulatorResolve);
registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);
