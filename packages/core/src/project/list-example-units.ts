import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '../paths/resolve-twinfile-root.js';

export const TWIN_EXAMPLE_TYPES = ['place', 'resource', 'character', 'story'] as const;

export type TwinExampleType = (typeof TWIN_EXAMPLE_TYPES)[number];

function isUnitDir(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function listExampleUnitIds(type: TwinExampleType, root?: string): string[] {
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