import { statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isExamplesCatalogRoot } from './examples-catalog.js';
import {
  TWIN_CATALOG_HUB,
  isTwinfileMonorepoRoot,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
} from './catalog-layout.js';

function splitCatalogRootsEnv(varName: string): string[] {
  const raw = process.env[varName]?.trim();
  if (!raw) return [];
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => resolve(s))
    .filter((p) => statSync(p, { throwIfNoEntry: false })?.isDirectory());
}

function discoverExamplesRoot(seed: string): string | undefined {
  const resolvedSeed = resolve(seed);
  const coreAnchor = dirname(fileURLToPath(import.meta.url));

  const fromBundled = resolve(coreAnchor, '../../../../catalog/place/examples');
  if (isExamplesCatalogRoot(fromBundled)) return fromBundled;

  const twinRootEnv = process.env.TF_TWINFILE_ROOT?.trim();
  if (twinRootEnv) {
    const fromTwin = resolveTypeExamplesRoot('place', resolve(twinRootEnv));
    if (isExamplesCatalogRoot(fromTwin)) return fromTwin;
  }

  const twinfileSibling = resolve(
    resolvedSeed,
    `../../twinfile/${TWIN_CATALOG_HUB}/place/examples`,
  );
  if (isExamplesCatalogRoot(twinfileSibling)) return twinfileSibling;

  let dir = resolvedSeed;
  for (let i = 0; i < 12; i += 1) {
    const catalogPlace = join(dir, TWIN_CATALOG_HUB, 'place', 'examples');
    if (isExamplesCatalogRoot(catalogPlace)) return catalogPlace;
    if (isTwinfileMonorepoRoot(dir)) {
      const typed = resolveTypeExamplesRoot('place', dir);
      if (isExamplesCatalogRoot(typed)) return typed;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  const fallbackRoot = resolveTwinfileRoot(resolvedSeed);
  const typed = resolveTypeExamplesRoot('place', fallbackRoot);
  if (isExamplesCatalogRoot(typed)) return typed;

  return undefined;
}

/** All examples catalog roots (env list + walk-up discovery). */
export function resolveExamplesRoots(fromDir?: string): string[] {
  const fromEnv = [
    ...splitCatalogRootsEnv('TF_PLACE_CATALOG'),
    ...splitCatalogRootsEnv('TF_EXAMPLES_ROOT'),
    ...splitCatalogRootsEnv('EXAMPLES_ROOT'),
  ];
  const discovered = discoverExamplesRoot(fromDir ?? process.cwd());
  const merged: string[] = [...fromEnv];
  if (discovered) {
    const abs = resolve(discovered);
    if (!merged.some((r) => resolve(r) === abs)) {
      merged.push(abs);
    }
  }
  return merged;
}

/** Resolve examples root (env, monorepo sibling, or walk-up from unit dir). */
export function resolveExamplesRoot(fromDir?: string): string | undefined {
  return resolveExamplesRoots(fromDir)[0];
}