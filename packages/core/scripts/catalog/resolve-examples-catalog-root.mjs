import { statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolvePlaceExamplesCatalogRoot,
  resolveTwinfileRootFromImportMeta,
  TWIN_CATALOG_HUB,
} from './resolve-twinfile-paths.mjs';

/** Canonical place golden catalog (`catalog/place/examples`). */
export function resolveExamplesCatalogRoot(fromImportMetaUrl) {
  const fromEnv = process.env.TF_EXAMPLES_ROOT ?? process.env.EXAMPLES_ROOT;
  if (fromEnv) {
    const resolved = resolve(fromEnv);
    if (statSync(join(resolved, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return resolved;
    }
  }

  const twinfileRoot = resolveTwinfileRootFromImportMeta(fromImportMetaUrl);
  const candidates = [
    resolvePlaceExamplesCatalogRoot(twinfileRoot),
    resolve(dirname(fileURLToPath(fromImportMetaUrl)), `../../../../${TWIN_CATALOG_HUB}/place/examples`),
  ];
  for (const catalog of candidates) {
    if (statSync(join(catalog, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return catalog;
    }
  }
  return candidates[0];
}

export function resolveSimulatorCatalogRoot(fromImportMetaUrl) {
  const fromEnv = process.env.TF_SIMULATOR_ROOT ?? process.env.SIMULATOR_ROOT;
  if (fromEnv) return resolve(fromEnv);
  const coreRoot = resolve(dirname(fileURLToPath(fromImportMetaUrl)), '../..');
  const candidates = [
    resolve(coreRoot, '../simulator'),
    resolve(coreRoot, '../../packages/simulator'),
    resolve(coreRoot, '../../../simulator'),
  ];
  for (const candidate of candidates) {
    if (statSync(join(candidate, 'events.registry.json'), { throwIfNoEntry: false })?.isFile()) {
      return candidate;
    }
  }
  return candidates[0];
}