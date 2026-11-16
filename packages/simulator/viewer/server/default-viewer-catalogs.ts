import { resolve } from 'node:path';

import { isExamplesCatalogRoot, resolveExamplesRoot } from '@doppler-group/twinfile-core';

import { resolveViewerPackageRoot } from './resolve-workbench-static.js';

/** Default workbench catalog: the place examples (`catalog/place/examples`); events load from the event catalog. */
export function resolveDefaultViewerIncorporate(fromDir = process.cwd()): string[] {
  const examplesRoot = resolveExamplesRoot(fromDir);
  if (examplesRoot) return [resolve(examplesRoot)];
  const monorepoExamples = resolve(resolveViewerPackageRoot(), '../../../catalog/place/examples');
  return isExamplesCatalogRoot(monorepoExamples) ? [monorepoExamples] : [];
}
