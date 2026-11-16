import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot, type TwinCatalogType } from '../paths/catalog-layout.js';

function isUnitDir(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function listExampleUnitIds(type: TwinCatalogType, root?: string): string[] {
  const base = root ?? resolveTwinfileRoot();
  const examples = resolveTypeExamplesRoot(type, base);
  try {
    return readdirSync(examples).filter((name) => {
      if (name.startsWith('.')) return false;
      return isUnitDir(join(examples, name));
    });
  } catch {
    return [];
  }
}