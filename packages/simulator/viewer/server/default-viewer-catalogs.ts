import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { isExamplesCatalogRoot, resolveExamplesRoot, resolveSimulatorRoot } from '@local-hosting/twinfile-core';

import { resolveViewerPackageRoot } from './resolve-workbench-static.js';

function isSimulatorCatalogRoot(dir: string): boolean {
  const root = resolve(dir);
  return (
    statSync(join(root, 'events.registry.json'), { throwIfNoEntry: false })?.isFile() === true ||
    statSync(join(root, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile() === true
  );
}

/** Default workbench catalogs: repo `examples/` + hazard catalog `simulator/`. */
export function resolveDefaultViewerIncorporate(fromDir = process.cwd()): string[] {
  const merged: string[] = [];
  const pushUnique = (dir: string | undefined) => {
    if (!dir) return;
    const abs = resolve(dir);
    if (!merged.some((r) => resolve(r) === abs)) merged.push(abs);
  };

  pushUnique(resolveExamplesRoot(fromDir));
  pushUnique(resolveSimulatorRoot(fromDir));

  if (merged.length > 0) return merged;

  const viewerRoot = resolveViewerPackageRoot();
  const monorepoExamples = resolve(viewerRoot, '../../../catalog/place/examples');
  const monorepoSimulator = resolve(viewerRoot, '..');
  if (isExamplesCatalogRoot(monorepoExamples)) pushUnique(monorepoExamples);
  if (isSimulatorCatalogRoot(monorepoSimulator)) pushUnique(monorepoSimulator);

  return merged;
}
