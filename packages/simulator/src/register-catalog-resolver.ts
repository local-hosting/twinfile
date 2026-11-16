import { registerCatalogTwinfileResolver } from '@doppler-group/twinfile-core';

import { resolveCatalogTwinfileRef } from './ref/catalog-twinfile-resolve.js';

/** Wire place-event catalog refs into `@doppler-group/twinfile-core` `resolveTwinfileByRef`. */
export function registerSimulatorCatalog(): void {
  registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);
}

registerSimulatorCatalog();
