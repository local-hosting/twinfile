#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { resolveTwinCli } from '../../packages/tooling/scripts/resolve-twin-cli.mjs';

import { findTwinfileDirs } from './catalog/find-twinfile-dirs.mjs';
import { resolveTwinfileHeadPath } from './catalog/resolve-twinfile-dir.mjs';
import { resolveExamplesCatalogRoot } from './catalog/resolve-examples-catalog-root.mjs';
import { resolveTwinfileRootFromPlaceCatalog, resolveTypeExamplesRoot } from './catalog/resolve-twinfile-paths.mjs';

const coreRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const twinCli = resolveTwinCli(import.meta.url);
const examplesRoot = resolveExamplesCatalogRoot(import.meta.url);
const resolvedTwinfileRoot = resolveTwinfileRootFromPlaceCatalog(examplesRoot);
const storyExamplesRoot = resolveTypeExamplesRoot('story', resolvedTwinfileRoot);
const simulatorRoot = resolve(process.env.TF_SIMULATOR_ROOT ?? join(coreRoot, '../simulator'));

function runTwin(args) {
  return spawnSync(process.execPath, [twinCli, ...args], {
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env, TF_EXAMPLES_ROOT: examplesRoot, TF_SIMULATOR_ROOT: simulatorRoot },
  });
}

function pushUnitDir(dir, ref) {
  const twinfilePath = resolveTwinfileHeadPath(dir);
  if (!twinfilePath) return 1;
  const manifest = parseYaml(readFileSync(twinfilePath, 'utf8'));
  const kind = String(manifest.kind ?? '');
  if (kind === 'scenario' || manifest.role === 'run') {
    const build = runTwin(['build', dir, '--no-lock']);
    if (build.status !== 0) return build.status ?? 1;
  }
  console.log(`push ${ref} from ${dir}`);
  return runTwin(['push', dir, '--ref', ref]).status ?? 1;
}

function refFromManifest(manifest, fallbackName) {
  const unitId = String(manifest.id ?? manifest.name ?? fallbackName);
  const version = String(manifest.version ?? '0.0.0');
  const kind = String(manifest.kind ?? '');
  const role = String(manifest.role ?? '');
  if (kind === 'resource' || kind === 'character' || kind === 'story') {
    return `twinfile/${kind}/${unitId}:${version}`;
  }
  if (role === 'run' || kind === 'scenario') {
    return undefined;
  }
  return `twinfile/place/${unitId}:${version}`;
}

function pushCatalog(root) {
  let failed = 0;
  const seen = new Set();
  for (const dir of findTwinfileDirs(root).sort()) {
    if (seen.has(dir)) continue;
    seen.add(dir);
    const twinfilePath = resolveTwinfileHeadPath(dir);
    if (!twinfilePath) continue;
    const manifest = parseYaml(readFileSync(twinfilePath, 'utf8'));
    const name = String(manifest.id ?? manifest.name ?? '');
    if (!name) continue;
    const fallback = dir.slice(root.length + 1).split('/').pop() ?? name;
    const ref = refFromManifest(manifest, fallback);
    if (!ref) continue;
    if (pushUnitDir(dir, ref) !== 0) failed += 1;
  }
  return failed;
}

let failed = pushCatalog(examplesRoot);
if (statSync(storyExamplesRoot, { throwIfNoEntry: false })?.isDirectory()) {
  failed += pushCatalog(storyExamplesRoot);
}
if (statSync(simulatorRoot, { throwIfNoEntry: false })?.isDirectory()) {
  failed += pushCatalog(simulatorRoot);
}

if (failed > 0) {
  console.error(`push-example-units: ${failed} failure(s)`);
  process.exit(1);
}
console.log('push-example-units ok');
