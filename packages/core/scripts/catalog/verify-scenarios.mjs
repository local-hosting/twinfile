#!/usr/bin/env node
/** Run `twin verify` for every scene run with expected/digest.txt under story/scenes. */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { resolveTwinCli } from '../../../packages/tooling/scripts/resolve-twin-cli.mjs';

import { isRunHeadPath, resolveTwinfileHeadPath } from './resolve-twinfile-dir.mjs';
import { resolveExamplesCatalogRoot, resolveSimulatorCatalogRoot } from './resolve-examples-catalog-root.mjs';
import { resolveTwinfileRootFromPlaceCatalog, resolveTypeExamplesRoot } from './resolve-twinfile-paths.mjs';

const examplesRoot = resolveExamplesCatalogRoot(import.meta.url);
const twinfileRoot = resolveTwinfileRootFromPlaceCatalog(examplesRoot);
const storyExamplesRoot = resolveTypeExamplesRoot('story', twinfileRoot);
const simulatorRoot = resolveSimulatorCatalogRoot(import.meta.url);
const twinCli = resolveTwinCli(import.meta.url);

function isRunVerifyTarget(dir) {
  const headPath = resolveTwinfileHeadPath(dir);
  if (!headPath || !isRunHeadPath(headPath)) return false;
  return statSync(join(dir, 'expected/digest.txt'), { throwIfNoEntry: false })?.isFile() === true;
}

function findRuns(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
  if (isRunVerifyTarget(dir)) {
    acc.push(dir);
    return acc;
  }
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    findRuns(join(dir, name), acc);
  }
  return acc;
}

const runs = [
  ...(statSync(storyExamplesRoot, { throwIfNoEntry: false })?.isDirectory()
    ? findRuns(storyExamplesRoot)
    : []),
].sort();

if (!runs.length) {
  console.error('verify-scenarios: none found');
  process.exit(1);
}

let failed = 0;
for (const dir of runs) {
  const rel = `catalog/story/examples/${dir.slice(storyExamplesRoot.length + 1)}`;
  const run = spawnSync(process.execPath, [twinCli, 'verify', dir], {
    encoding: 'utf8',
    env: { ...process.env, TF_EXAMPLES_ROOT: examplesRoot, TF_SIMULATOR_ROOT: simulatorRoot },
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