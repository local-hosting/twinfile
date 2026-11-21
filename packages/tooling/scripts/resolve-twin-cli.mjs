#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Built `twin` entry from `@local-hosting/twinfile`. */
export function resolveTwinCli(fromImportMetaUrl) {
  let dir = dirname(fileURLToPath(fromImportMetaUrl));
  for (let depth = 0; depth < 12; depth += 1) {
    const twinfileCli = join(dir, 'packages/twinfile/dist/cli/twin.js');
    if (existsSync(twinfileCli)) return resolve(twinfileCli);
    const pkgCli = join(dir, 'dist/cli/twin.js');
    const pkgJson = join(dir, 'package.json');
    if (existsSync(pkgCli) && existsSync(pkgJson)) {
      try {
        const { name } = JSON.parse(readFileSync(pkgJson, 'utf8'));
        if (name === '@local-hosting/twinfile') return resolve(pkgCli);
      } catch {
        // ignore
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    'twin CLI not found (expected packages/twinfile/dist/cli/twin.js). Run: yarn workspace @local-hosting/twinfile build',
  );
}