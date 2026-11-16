import {
  loadTwinLocalMapMerged,
  ok,
  type CatalogTwinfileResolveInput,
  type CatalogTwinfileResolveResult,
} from '@doppler-group/twinfile-core';

import { ensureExamplesEventCatalog } from '../catalog/bootstrap-examples-catalog.js';
import { ensureSimulatorEventCatalog } from '../catalog/bootstrap-simulator-catalog.js';
import { getRegisteredPlaceEvent, resolveRegisteredPlaceEventRef } from '../catalog/event-catalog.js';
import { loadedTwinfileFromPlaceEvent } from '../catalog/synthetic-place-event-load.js';
import { resolveSimulatorRoot } from '@doppler-group/twinfile-core';

function versionMatches(manifestVersion: string, refTag: string | undefined): boolean {
  if (!refTag) return true;
  if (manifestVersion === refTag) return true;
  if (/^\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  if (/^\d+\.\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  return false;
}

/** Resolve `twinfile/*` refs to registered place events (situations / events). */
export function resolveCatalogTwinfileRef(input: CatalogTwinfileResolveInput): CatalogTwinfileResolveResult | undefined {
  const { ref, name, tag, options } = input;
  const simulatorRoot =
    options.simulatorRoot ?? resolveSimulatorRoot(options.examplesRoot);

  ensureExamplesEventCatalog(options.examplesRoot);
  if (simulatorRoot) ensureSimulatorEventCatalog(simulatorRoot);

  const catalogRef = ref.includes('/') ? ref : `twinfile/${ref}`;
  let catalogEvent = resolveRegisteredPlaceEventRef(catalogRef);
  if (!catalogEvent) {
    const bare = getRegisteredPlaceEvent(name);
    if (bare && versionMatches(String(bare.version ?? '1.0.0'), tag)) catalogEvent = bare;
  }
  if (!catalogEvent) return undefined;

  void loadTwinLocalMapMerged(options.examplesRoot, simulatorRoot);
  return ok({ ref, loaded: loadedTwinfileFromPlaceEvent(catalogEvent, ref) });
}
