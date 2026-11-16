#!/usr/bin/env node
/** Place × situation matrix: each site with plans should pass strict check. */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { resolveTwinCli } from '../../../tooling/scripts/resolve-twin-cli.mjs';
import { resolvePlaceExamplesCatalogRoot, resolveSimulatorRoot } from '../../dist/index.js';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const examplesRoot = resolvePlaceExamplesCatalogRoot();
const simulatorRoot = resolveSimulatorRoot();
const coreRoot = process.env.TF_CORE_ROOT
  ? resolve(process.env.TF_CORE_ROOT)
  : resolve(scriptsDir, '../..');
const twinCli = resolveTwinCli(import.meta.url);

const require = createRequire(join(coreRoot, 'package.json'));
const { loadTwinfile } = require(join(coreRoot, 'dist/index.js'));
const { listPlaceSituationBindings } = require('@doppler-group/twinfile-place');

const inheritOpts = { examplesRoot, simulatorRoot };

function listSiteDirs() {
  const top = readdirSync(examplesRoot)
    .filter((name) => !name.startsWith('.') && !name.startsWith('base-') && !name.startsWith('mixin-'))
    .map((name) => join(examplesRoot, name))
    .filter(
      (dir) =>
        statSync(dir, { throwIfNoEntry: false })?.isDirectory() &&
        statSync(join(dir, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile(),
    );
  const nestedCampus = join(examplesRoot, 'mobility-hub', 'campus');
  if (
    statSync(join(nestedCampus, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile() &&
    !top.includes(nestedCampus)
  ) {
    top.push(nestedCampus);
  }
  return top;
}

let failed = 0;
for (const dir of listSiteDirs()) {
  const name = dir.split(/[/\\]/).pop() ?? dir;
  const loaded = loadTwinfile(dir);
  if (!loaded.ok) continue;
  const bindings = listPlaceSituationBindings(loaded.value, inheritOpts);
  const planCount = bindings.ok ? bindings.value.length : 0;
  if (planCount === 0) continue;
  const run = spawnSync(process.execPath, [twinCli, 'check', dir, '--strict', '--json'], {
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    console.error(run.stderr || run.stdout);
    failed += 1;
    continue;
  }
  const parsed = JSON.parse(run.stdout.trim());
  console.log(`ok matrix ${name} strictBindings=${parsed.strictPlans}`);
}

if (failed) process.exit(1);
console.log('check-matrix ok');
