import { resolve } from 'node:path';

import type { TwinfileResolveOptions } from '../ref/twinfile-resolver.js';
import { resolvePlaceExamplesCatalogRoot } from './catalog-layout.js';

/** Twin catalog roots for compose/refs/player; event units resolve from `catalog/event/examples`. */
export function catalogResolveOptions(examplesRoot?: string): TwinfileResolveOptions {
  return {
    examplesRoot: examplesRoot?.trim() ? resolve(examplesRoot) : resolvePlaceExamplesCatalogRoot(),
  };
}
