import { dirname, resolve } from 'node:path';

import { parseSceneAddress } from '../load/load-scene-run.js';
import { loadTwinLocalMap } from '../ref/twin-local-map.js';
import { isExamplesCatalogRoot } from './examples-catalog.js';
import { resolvePlaceExamplesCatalogRoot, resolveTwinfileRoot } from './catalog-layout.js';

/** Place golden catalog for the monorepo containing `fromDir`, when it exists. */
export function resolveExamplesRoot(fromDir?: string): string | undefined {
  const catalog = resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot(fromDir));
  return isExamplesCatalogRoot(catalog) ? catalog : undefined;
}

/** Nearest ancestor of `fromDir` that owns `twin.local.yaml` refs (overlay packs such as river-twinfile). */
export function resolveTwinfilePackRoot(fromDir: string): string | undefined {
  const scene = parseSceneAddress(fromDir);
  let dir = resolve(scene?.storyRoot ?? fromDir);
  for (let i = 0; i < 16; i += 1) {
    if (loadTwinLocalMap(dir).size > 0) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/**
 * Ref resolution root for audit / compose / build / run:
 * overlay pack `twin.local.yaml` when present, else monorepo place examples catalog.
 */
export function resolveAuditExamplesRoot(fromDir: string): string | undefined {
  return resolveTwinfilePackRoot(fromDir) ?? resolveExamplesRoot(fromDir);
}
