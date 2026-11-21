#!/usr/bin/env node
/** Replace workspace/file deps with semver pins from twinfilePinnedDependencies before publish. */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pins = pkg.twinfilePinnedDependencies ?? {};
pkg.dependencies ??= {};

for (const [name, version] of Object.entries(pins)) {
  if (!(name in pkg.dependencies)) continue;
  pkg.dependencies[name] = String(version).trim();
}

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('pin-deps-for-publish: runtime deps pinned for registry tarball');
