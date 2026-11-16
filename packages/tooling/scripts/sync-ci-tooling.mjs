#!/usr/bin/env node
/**
 * Copy CI helpers into standalone package mirrors (not used in the monorepo — run tooling scripts directly).
 */
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const toolingScripts = join(root, 'packages/tooling/scripts');

const copies = [
  ['ci-prepare-deps.mjs', ['packages/core', 'packages/bridge', 'packages/site']],
  ['resolve-geotypes-root.mjs', ['packages/core']],
];

for (const [name, packages] of copies) {
  const source = join(toolingScripts, name);
  for (const pkg of packages) {
    const dest = join(root, pkg, 'scripts', name);
    copyFileSync(source, dest);
    console.log(`synced ${pkg}/scripts/${name}`);
  }
}