#!/usr/bin/env node
/** Rewrite `run.expected.digest` (and `metrics` when verify fails) on every pinned story scene run. */
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument } from 'yaml';

import { resolveTwinCli } from './resolve-twin-cli.mjs';
import { listPinnedSceneRuns } from '../../../packages/core/scripts/catalog/list-scene-runs.mjs';
import {
  findTwinfileYamlPath,
  parseSceneAddress,
  resolvePlaceExamplesCatalogRoot,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
} from '../../core/dist/index.js';

const twinfileRoot = resolveTwinfileRoot(resolvePlaceExamplesCatalogRoot());
const twinCli = resolveTwinCli(import.meta.url);

function twin(args) {
  return spawnSync(process.execPath, [twinCli, ...args], { encoding: 'utf8' });
}

function writeExpected(address, key, value) {
  const { storyRoot, sceneId } = parseSceneAddress(address);
  const head = findTwinfileYamlPath(storyRoot);
  const doc = parseDocument(readFileSync(head, 'utf8'));
  const scenes = doc.getIn(['story', 'scenes']);
  const scene = scenes.items.find((item) => item.get('id') === sceneId);
  scene.setIn(['run', 'expected', key], doc.createNode(value));
  writeFileSync(head, doc.toString({ lineWidth: 0 }));
}

function fail(result) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

for (const address of listPinnedSceneRuns(resolveTypeExamplesRoot('story', twinfileRoot))) {
  const build = twin(['build', address, '--json', '--no-lock']);
  if (build.status !== 0) fail(build);
  writeExpected(address, 'digest', JSON.parse(build.stdout.trim()).digest);
  if (twin(['verify', address]).status !== 0) {
    const { storyRoot, sceneId } = parseSceneAddress(address);
    const metricsSrc = join(storyRoot, 'runs', `${sceneId}.metrics.json`);
    if (statSync(metricsSrc, { throwIfNoEntry: false })?.isFile()) {
      writeExpected(address, 'metrics', JSON.parse(readFileSync(metricsSrc, 'utf8')));
    }
    const retry = twin(['verify', address]);
    if (retry.status !== 0) fail(retry);
  }
  console.log(`ok refresh ${address.slice(twinfileRoot.length + 1)}`);
}
