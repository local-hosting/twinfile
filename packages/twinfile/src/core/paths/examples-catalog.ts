import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { findTwinfileYamlPath } from '../load/twinfile-locator.js';

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

/** Catalog root: twin.local.yaml and/or top-level place unit folders. */
export function isExamplesCatalogRoot(dir: string): boolean {
  const root = resolve(dir);
  if (statSync(join(root, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
    return true;
  }
  return listFlatExampleUnitNames(root).length > 0;
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
    if (findTwinfileYamlPath(child) !== undefined) out.push(name);
  }
  return out.sort();
}

export function flatExampleUnitDir(catalogRoot: string, slug: string): string {
  return join(resolve(catalogRoot), slug);
}