#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { listTwinfileSituationBindings, loadTwinfile } from '../dist/index.js';
import { listPlaceSituationBindings } from '@doppler-group/twinfile-place';

import { resolveTwinCli } from '../../tooling/scripts/resolve-twin-cli.mjs';
import { resolveExamplesCatalogRoot } from './catalog/resolve-examples-catalog-root.mjs';

const coreRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const twinCli = resolveTwinCli(import.meta.url);
const examplesRoot = resolveExamplesCatalogRoot(import.meta.url);
const simulatorRoot = resolve(process.env.TF_SIMULATOR_ROOT ?? join(coreRoot, '../simulator'));

function runTwin(args) {
  return spawnSync(process.execPath, [twinCli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TF_EXAMPLES_ROOT: examplesRoot, TF_SIMULATOR_ROOT: simulatorRoot },
  });
}

function readManifest(placeDir) {
  const path = join(placeDir, 'Twinfile.yaml');
  const raw = readFileSync(path, 'utf8');
  return parseYaml(raw);
}

/** `for:` of each situation binding the unit declares (`bind:` steps or binding yaml). */
function declaredBindingFors(placeDir) {
  const loaded = loadTwinfile(placeDir);
  if (!loaded.ok) return [];
  const inheritOpts = { examplesRoot, simulatorRoot };
  const composed = listPlaceSituationBindings(loaded.value, inheritOpts);
  if (composed.ok && composed.value.length > 0) {
    return composed.value.map((row) => String(row.doc.for ?? ''));
  }
  return listTwinfileSituationBindings(loaded.value).map((row) => String(row.doc.for ?? ''));
}

function readExpectedContract(placeDir) {
  const path = join(placeDir, 'expected/contract.json');
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) return undefined;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function verifyExpected(placeDir, stdout) {
  const expected = readExpectedContract(placeDir);
  if (!expected) return null;
  let parsed;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return `expected JSON from twin check --json for ${placeDir}`;
  }
  if (parsed.strictBindings !== expected.strictBindings) {
    return `strictBindings: expected ${expected.strictBindings}, got ${parsed.strictBindings}`;
  }
  if (Array.isArray(expected.bindings) && expected.bindings.length > 0) {
    const manifest = readManifest(placeDir);
    const planFors = declaredBindingFors(placeDir);
    const inheritsPlans = typeof manifest.from === 'string' && manifest.from.trim().length > 0;
    if (planFors.length !== expected.strictBindings && !inheritsPlans) {
      return `manifest bindings count ${planFors.length} !== expected.strictBindings ${expected.strictBindings}`;
    }
    for (const row of expected.bindings) {
      if (!planFors.includes(row.for)) return `missing binding for situation ${row.for}`;
    }
  }
  return null;
}

const SKIP = new Set(['conf', 'presets', 'fixtures', 'docs', 'node_modules', 'dist', 'viewer', 'scripts']);

function isTwinfilePlaceDir(dir) {
  return statSync(join(dir, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile();
}

function listBaseUnitDirs() {
  return readdirSync(examplesRoot)
    .filter((name) => name.startsWith('base-'))
    .map((name) => join(examplesRoot, name))
    .filter((dir) => statSync(dir, { throwIfNoEntry: false })?.isDirectory() && isTwinfilePlaceDir(dir));
}

function listSiteUnitDirs() {
  return readdirSync(examplesRoot)
    .filter((name) => !name.startsWith('.') && !SKIP.has(name))
    .map((name) => join(examplesRoot, name))
    .filter((dir) => {
      if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return false;
      if (!isTwinfilePlaceDir(dir)) return false;
      const slug = nameFromPath(dir);
      return (
        !slug.startsWith('base-') &&
        !slug.startsWith('mixin-') &&
        !slug.endsWith('-programme')
      );
    });
}

function nameFromPath(dir) {
  const parts = dir.split(/[/\\]/);
  return parts[parts.length - 1] ?? dir;
}

let failed = 0;

for (const dir of listBaseUnitDirs()) {
  const name = nameFromPath(dir);
  const check = runTwin(['check', dir]);
  if (check.status !== 0) {
    console.error(check.stderr || check.stdout);
    failed += 1;
    continue;
  }
  console.log(`ok check base ${name}`);
  const build = runTwin(['build', dir, '--no-lock']);
  if (build.status !== 0) {
    console.error(build.stderr || build.stdout);
    failed += 1;
  } else {
    console.log(`ok build base ${name}`);
  }
}

const siteDirs = listSiteUnitDirs();
if (siteDirs.length === 0) {
  console.error(`check-examples: no site units under ${examplesRoot} (set EXAMPLES_ROOT)`);
  process.exit(1);
}

for (const dir of siteDirs) {
  const name = nameFromPath(dir);

  const check = runTwin(['check', dir]);
  if (check.status !== 0) {
    console.error(check.stderr || check.stdout);
    failed += 1;
    continue;
  }
  console.log(`ok check ${name}`);

  const manifest = readManifest(dir);
  const inheritsPlans = typeof manifest.from === 'string' && manifest.from.trim().length > 0;
  const needsStrict = declaredBindingFors(dir).length > 0 || inheritsPlans;
  if (needsStrict) {
    const strict = runTwin(['check', dir, '--strict', '--json']);
    if (strict.status !== 0) {
      console.error(strict.stderr || strict.stdout);
      failed += 1;
      continue;
    }
    const mismatch = verifyExpected(dir, strict.stdout);
    if (mismatch) {
      console.error(`check-examples: ${name}: ${mismatch}`);
      failed += 1;
      continue;
    }
    console.log(`ok check ${name} --strict`);

    const build = runTwin(['build', dir, '--no-lock']);
    if (build.status !== 0) {
      console.error(build.stderr || build.stdout);
      failed += 1;
    } else {
      console.log(`ok build ${name}`);
    }
  }
}

function findScenarioDirs(rootDir) {
  const out = [];
  function walk(dir) {
    const twinfile = join(dir, 'Twinfile.yaml');
    if (statSync(twinfile, { throwIfNoEntry: false })?.isFile()) {
      const manifest = parseYaml(readFileSync(twinfile, 'utf8'));
      if (manifest?.kind === 'scenario') {
        out.push(dir);
        return;
      }
    }
    for (const name of readdirSync(dir)) {
      const child = join(dir, name);
      if (statSync(child).isDirectory()) walk(child);
    }
  }
  walk(rootDir);
  return out;
}

for (const scenario of findScenarioDirs(examplesRoot)) {
  const rel = scenario.slice(examplesRoot.length + 1);
  const scenarioCheck = runTwin(['check', scenario, '--strict', '--json']);
  if (scenarioCheck.status !== 0) {
    console.error(scenarioCheck.stderr || scenarioCheck.stdout);
    failed += 1;
    continue;
  }
  console.log(`ok check ${rel} scenario --strict`);

  const scenarioBuild = runTwin(['build', scenario, '--no-lock']);
  if (scenarioBuild.status !== 0) {
    console.error(scenarioBuild.stderr || scenarioBuild.stdout);
    failed += 1;
    continue;
  }
  console.log(`ok build ${rel} scenario`);
  rmSync(join(scenario, '.twin'), { recursive: true, force: true });

  const expectedDigest = join(scenario, 'expected/digest.txt');
  if (statSync(expectedDigest, { throwIfNoEntry: false })?.isFile()) {
    const scenarioVerify = runTwin(['verify', scenario]);
    if (scenarioVerify.status !== 0) {
      console.error(scenarioVerify.stderr || scenarioVerify.stdout);
      failed += 1;
    } else {
      console.log(`ok verify ${rel} scenario`);
    }
  }
}

if (failed > 0) {
  console.error(`check-examples: ${failed} failure(s)`);
  process.exit(1);
}

console.log('check-examples ok');
