import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT_SKIP = new Set([
  'conf',
  'presets',
  'fixtures',
  'docs',
  'node_modules',
  'dist',
  'viewer',
  'scripts',
]);

/** Flat layout: twin.local.yaml and/or top-level Twinfile unit folders. */
export function isFlatExamplesCatalogRoot(dir: string): boolean {
  const root = resolve(dir);
  if (statSync(join(root, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
    return true;
  }
  return listFlatExampleUnitNames(root).length > 0;
}

export function isExamplesCatalogRoot(dir: string): boolean {
  return isFlatExamplesCatalogRoot(dir);
}

/** @deprecated Bucketed `places/` / `bases/` layouts — use flat catalog only. */
export function isLegacyExamplesCatalogRoot(_dir: string): boolean {
  return false;
}

function hasTwinfileHead(unitDir: string): boolean {
  for (const name of ['Place.yaml', 'place.yaml', 'Twinfile.yaml', 'twinfile.yaml']) {
    if (statSync(join(unitDir, name), { throwIfNoEntry: false })?.isFile()) {
      return true;
    }
  }
  return false;
}

/** Top-level publishable unit folder names under a flat catalog root. */
export function listFlatExampleUnitNames(catalogRoot: string): string[] {
  const root = resolve(catalogRoot);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('.') || ROOT_SKIP.has(name)) continue;
    const child = join(root, name);
    if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) continue;
    if (hasTwinfileHead(child)) out.push(name);
  }
  return out.sort();
}

export function flatExampleUnitDir(catalogRoot: string, slug: string): string {
  return join(resolve(catalogRoot), slug);
}

/** @deprecated Use `flatExampleUnitDir`. */
export function legacyPlacesDir(catalogRoot: string): string {
  return join(resolve(catalogRoot), 'places');
}

export function examplePlaceDir(catalogRoot: string, name: string): string {
  return flatExampleUnitDir(catalogRoot, name);
}