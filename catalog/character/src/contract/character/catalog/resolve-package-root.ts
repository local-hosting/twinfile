import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isCharacterPackageRoot(dir: string): boolean {
  const pkg = join(dir, 'package.json');
  if (!existsSync(pkg)) return false;
  try {
    const raw = readFileSync(pkg, 'utf8');
    return raw.includes('@local-hosting/twinfile-character');
  } catch {
    return existsSync(join(dir, 'src', 'twin-module.ts'));
  }
}

/** Resolve `@local-hosting/twinfile-character` workspace root. */
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

/**
 * Character/situations YAML under this package’s `libs/`
 * (`audience|journey|psychology/`). Prefer the package root — do not re-derive
 * via twinfile monorepo walk. Yarn `portal:` / nested `node_modules` symlink
 * paths do not walk up into `local-hosting/twinfile`, so that path double-nests
 * `catalog/character` and misses the YAML on disk.
 */
export function resolveCharacterCatalogsRoot(moduleUrl: string): string {
  return join(resolvePackageRoot(moduleUrl), 'libs');
}