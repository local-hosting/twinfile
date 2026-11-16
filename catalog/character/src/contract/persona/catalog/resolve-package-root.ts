import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveCharacterCatalogRoot, resolveTwinfileRoot } from '@doppler-group/twinfile-core';

function isCharacterPackageRoot(dir: string): boolean {
  const pkg = join(dir, 'package.json');
  if (!existsSync(pkg)) return false;
  try {
    const raw = readFileSync(pkg, 'utf8');
    return raw.includes('@doppler-group/twinfile-character');
  } catch {
    return existsSync(join(dir, 'src', 'twin-module.ts'));
  }
}

/** Resolve `@doppler-group/twinfile-character` workspace root. */
export function resolvePackageRoot(moduleUrl: string, depth = 3): string {
  let dir = dirname(fileURLToPath(moduleUrl));

  for (let index = 0; index < depth; index += 1) {
    if (isCharacterPackageRoot(dir)) return dir;
    dir = join(dir, '..');
  }

  for (let index = 0; index < 8; index += 1) {
    if (isCharacterPackageRoot(dir)) return dir;
    dir = join(dir, '..');
  }

  return dir;
}

/** PCM/JSM YAML under `catalog/character/libs/`. */
export function resolveCharacterCatalogsRoot(moduleUrl: string): string {
  const packageRoot = resolvePackageRoot(moduleUrl);
  return resolveCharacterCatalogRoot(resolveTwinfileRoot(packageRoot));
}