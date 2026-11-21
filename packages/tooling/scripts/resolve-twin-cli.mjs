#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Built `twin` entry (`@local-hosting/twinfile-cli`, shimmed by `@local-hosting/twinfile-simulator`). */
export function resolveTwinCli(fromImportMetaUrl) {
  let dir = dirname(fileURLToPath(fromImportMetaUrl));
  for (let depth = 0; depth < 8; depth += 1) {
    const cliCandidate = join(dir, 'cli/dist/cli/twin.js');
    if (existsSync(cliCandidate)) return resolve(cliCandidate);
    const simulatorCandidate = join(dir, 'simulator/dist/cli/twin.js');
    if (existsSync(simulatorCandidate)) return resolve(simulatorCandidate);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    'twin CLI not found (expected packages/cli/dist/cli/twin.js). Run: yarn workspace @local-hosting/twinfile-cli build',
  );
}