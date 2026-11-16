import { resolve } from 'node:path';

import type { TwinfileResolveOptions } from '../ref/twinfile-resolver.js';
import { resolvePlaceExamplesCatalogRoot, resolveSimulatorRoot } from './catalog-layout.js';

/**
 * Twin **catalog** (place examples) + **simulator** package for compose/refs/player.
 * Situations are simulator modules (`catalogKind: situation`), not twins under `catalog/`.
 */
export function catalogResolveOptions(
  examplesRoot?: string,
  simulatorRoot?: string,
): TwinfileResolveOptions {
  const placeExamples = examplesRoot?.trim()
    ? resolve(examplesRoot)
    : resolvePlaceExamplesCatalogRoot();
  return {
    examplesRoot: placeExamples,
    simulatorRoot: simulatorRoot ?? resolveSimulatorRoot(placeExamples),
  };
}
