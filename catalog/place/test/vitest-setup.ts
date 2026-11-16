import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerCatalogTwinfileResolver } from '@doppler-group/twinfile-core';

import { testSimulatorRoot } from './test-examples-root.js';

const simulatorRoot = testSimulatorRoot(dirname(fileURLToPath(import.meta.url)));

// Dynamic import: the simulator resolver lives outside this package and is test-only wiring.
const { resolveCatalogTwinfileRef } = await import(resolve(simulatorRoot, 'src/ref/catalog-twinfile-resolve.js'));
registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);
