import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { findTwinfileYamlPath } from '../load/twinfile-locator.js';
import { resolveTwinfileRoot, resolveTypeExamplesRoot, type TwinCatalogType } from '../paths/catalog-layout.js';

function isUnitDir(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** Golden unit folder names under `catalog/<type>/examples` that have a twin head. */
export function listExampleUnitIds(type: TwinCatalogType, root?: string): string[] {
  const base = root ?? resolveTwinfileRoot();
  const examples = resolveTypeExamplesRoot(type, base);
  try {
    return readdirSync(examples)
      .filter((name) => {
        if (name.startsWith('.')) return false;
        const dir = join(examples, name);
        return isUnitDir(dir) && findTwinfileYamlPath(dir) !== undefined;
      })
      .sort();
  } catch {
    return [];
  }
}
