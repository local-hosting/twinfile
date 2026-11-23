import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `packages/twinfile` (this npm package root). */
export function resolveTwinfilePackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const pkg = join(dir, 'package.json');
    if (statSync(pkg, { throwIfNoEntry: false })?.isFile()) {
      const doc = JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string };
      if (doc.name === '@local-hosting/twinfile') return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not resolve @local-hosting/twinfile package root');
}

/** Bundled `spec/` at the `@local-hosting/twinfile` package root (shipped in the npm tarball). */
export function resolveSpecPackageRoot(): string {
  const bundled = join(resolveTwinfilePackageRoot(), 'spec');
  if (statSync(bundled, { throwIfNoEntry: false })?.isDirectory()) {
    return bundled;
  }
  throw new Error(
    'Missing twinfile spec/ beside @local-hosting/twinfile — reinstall or publish with spec in package files',
  );
}

export function resolveSpecSchemasRoot(): string {
  return join(resolveSpecPackageRoot(), 'schemas', '1');
}

export function resolveSpecConfRoot(): string {
  return join(resolveSpecPackageRoot(), 'conf');
}