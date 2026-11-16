#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTwinCli } from './resolve-twin-cli.mjs';
import { isRunHeadPath, resolveTwinfileHeadPath } from '../../../packages/core/scripts/catalog/resolve-twinfile-dir.mjs';
import {
  resolveExamplesCatalogRoot,
  resolveSimulatorCatalogRoot,
} from '../../../packages/core/scripts/catalog/resolve-examples-catalog-root.mjs';

import {
  resolveTwinfileRootFromPlaceCatalog,
  resolveTypeExamplesRoot,
} from '../../../packages/core/scripts/catalog/resolve-twinfile-paths.mjs';

const examplesRoot = resolveExamplesCatalogRoot(import.meta.url);
const twinfileRoot = resolveTwinfileRootFromPlaceCatalog(examplesRoot);
const storyExamples = resolveTypeExamplesRoot('story', twinfileRoot);
const simulatorRoot = resolveSimulatorCatalogRoot(import.meta.url);
const twinCli = resolveTwinCli(import.meta.url);
const twinEnv = {
  ...process.env,
  TF_EXAMPLES_ROOT: examplesRoot,
  TF_SIMULATOR_ROOT: simulatorRoot,
  TF_TWINFILE_ROOT: twinfileRoot,
};

function findStoryRuns(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
  const headPath = resolveTwinfileHeadPath(dir);
  if (headPath && isRunHeadPath(headPath) && statSync(join(dir, 'expected/digest.txt'), { throwIfNoEntry: false })?.isFile()) {
    acc.push(dir);
    return acc;
  }
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    findStoryRuns(join(dir, name), acc);
  }
  return acc;
}

const runs = findStoryRuns(storyExamples);

for (const dir of runs) {
  const build = spawnSync(process.execPath, [twinCli, 'build', dir, '--json', '--no-lock'], {
    encoding: 'utf8',
    env: twinEnv,
  });
  if (build.status !== 0) {
    console.error(build.stderr || build.stdout);
    process.exit(1);
  }
  const { digest } = JSON.parse(build.stdout.trim());
  const headPath = resolveTwinfileHeadPath(dir);
  const manifest = readFileSync(headPath, 'utf8');
  const runId = /^\s*id:\s*([^\n#]+)/m.exec(manifest)?.[1]?.trim() ?? '';
  writeFileSync(join(dir, 'expected/digest.txt'), `${digest}\n`, 'utf8');
  const verify = spawnSync(process.execPath, [twinCli, 'verify', dir], {
    encoding: 'utf8',
    env: twinEnv,
  });
  if (verify.status !== 0) {
    const metricsSrc = join(dir, 'runs', `${runId}.metrics.json`);
    if (statSync(metricsSrc, { throwIfNoEntry: false })?.isFile()) {
      copyFileSync(metricsSrc, join(dir, 'expected/metrics.json'));
    }
    const retry = spawnSync(process.execPath, [twinCli, 'verify', dir], {
      encoding: 'utf8',
      env: twinEnv,
    });
    if (retry.status !== 0) {
      console.error(retry.stderr || retry.stdout);
      process.exit(1);
    }
  }
  console.log(`ok refresh ${dir.slice(twinfileRoot.length + 1)}`);
}