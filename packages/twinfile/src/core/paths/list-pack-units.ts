import { readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { findTwinfileYamlPath } from '../load/twinfile-locator.js';
import { TWIN_CATALOG_TYPES, type TwinCatalogType } from './catalog-layout.js';

/** `story/`, `place/`, … under a pack root (e.g. osc-twinfile). */
export function packKindFromDir(dir: string): TwinCatalogType | undefined {
  const kind = basename(resolve(dir)) as TwinCatalogType;
  return TWIN_CATALOG_TYPES.includes(kind) ? kind : undefined;
}

export function listPackUnitDirs(kindDir: string): string[] {
  const root = resolve(kindDir);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) return [];
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('.')) continue;
    const child = join(root, name);
    if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) continue;
    if (findTwinfileYamlPath(child) === undefined) continue;
    out.push(child);
  }
  return out.sort();
}

export function listPackUnitDirsForPack(
  packRoot: string,
  typeFilter?: TwinCatalogType,
): string[] {
  const types = typeFilter ? [typeFilter] : [...TWIN_CATALOG_TYPES];
  const out: string[] = [];
  for (const type of types) {
    out.push(...listPackUnitDirs(join(resolve(packRoot), type)));
  }
  return out;
}

/** Overlay pack layout (`place/`, `story/`, … each with twin heads) without `twin.local.yaml`. */
export function isTwinfileOverlayPackRoot(dir: string): boolean {
  const root = resolve(dir);
  for (const type of TWIN_CATALOG_TYPES) {
    if (listPackUnitDirs(join(root, type)).length > 0) return true;
  }
  return false;
}

export function overlayPackUnitDir(
  packRoot: string,
  kind: TwinCatalogType,
  unitId: string,
): string {
  return join(resolve(packRoot), kind, unitId);
}