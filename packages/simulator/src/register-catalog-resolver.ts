import { registerCatalogTwinfileResolver } from '@local-hosting/twinfile-core';

import { resolveCatalogTwinfileRef } from './ref/catalog-twinfile-resolve.js';

/** Wire place-event catalog refs into `@local-hosting/twinfile-core` `resolveTwinfileByRef`. */
export function registerSimulatorCatalog(): void {
  registerCatalogTwinfileResolver(resolveCatalogTwinfileRef);
}

registerSimulatorCatalog();
