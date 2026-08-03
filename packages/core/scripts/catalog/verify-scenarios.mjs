#!/usr/bin/env node
/** Run `twin verify` for every story scene run that pins `run.expected.digest`. */
import { spawnSync } from 'node:child_process';

import { resolveTwinCli } from '../../../tooling/scripts/resolve-twin-cli.mjs';

import { listPinnedSceneRuns } from './list-scene-runs.mjs';
import { resolvePlaceExamplesCatalogRoot, resolveTwinfileRoot, resolveTypeExamplesRoot } from '../../dist/index.js';

const twinfileRoot = resolveTwinfileRoot(resolvePlaceExamplesCatalogRoot());
const twinCli = resolveTwinCli(import.meta.url);
const runs = listPinnedSceneRuns(resolveTypeExamplesRoot('story', twinfileRoot));

if (!runs.length) {
  console.error('verify-scenarios: none found');
  process.exit(1);
}

let failed = 0;
for (const address of runs) {
  const rel = address.slice(twinfileRoot.length + 1);
  const run = spawnSync(process.execPath, [twinCli, 'verify', address], {
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    console.error(run.stderr || run.stdout);
    failed += 1;
  } else {
    console.log(`ok verify ${rel}`);
  }
}

if (failed) process.exit(1);
console.log(`verify-scenarios ok (${runs.length})`);
