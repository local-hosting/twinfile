#!/usr/bin/env node
/**
 * Snapshot twinfile/id:version → `Place.digest` for published refs under examples.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { findTwinfileDirs } from './find-twinfile-dirs.mjs';
import { resolveTwinfileHeadPath } from './resolve-twinfile-dir.mjs';

import { resolveTwinCli } from '../../../tooling/scripts/resolve-twin-cli.mjs';

import { resolvePlaceExamplesCatalogRoot, resolveTwinfileRoot, resolveTypeExamplesRoot } from '../../dist/index.js';

const examplesRoot = resolvePlaceExamplesCatalogRoot();
const twinCli = resolveTwinCli(import.meta.url);

const refs = {};

function typedRef(manifest, id, version) {
  const kind = String(manifest.kind ?? '');
  const role = String(manifest.role ?? '');
  if (kind === 'resource' || kind === 'character' || kind === 'story' || kind === 'event') {
    return `twinfile/${kind}/${id}:${version}`;
  }
  if (role === 'run' || kind === 'scenario') {
    return undefined;
  }
  return `twinfile/place/${id}:${version}`;
}

function recordCatalogRoot(root, pathPrefix) {
  for (const dir of findTwinfileDirs(root)) {
    const twinfilePath = resolveTwinfileHeadPath(dir);
    if (!twinfilePath) continue;
    const manifest = parseYaml(readFileSync(twinfilePath, 'utf8'));
    const id = String(manifest.id ?? '').trim();
    const version = String(manifest.version ?? '').trim();
    if (!id || !version) continue;
    const ref = typedRef(manifest, id, version);
    if (!ref) continue;
    const build = spawnSync(process.execPath, [twinCli, 'build', dir, '--no-lock', '--json'], {
    encoding: 'utf8',
  });
  if (build.status !== 0) continue;
  try {
    const parsed = JSON.parse(build.stdout.trim());
    const rel = dir.slice(root.length + 1);
    const path = pathPrefix ? `${pathPrefix}/${rel}` : rel;
    const catalogParent =
      manifest.catalog && typeof manifest.catalog.parent === 'string' ? manifest.catalog.parent : undefined;
    refs[ref] = {
      digest: parsed.digest,
      kind: manifest.kind,
      path,
      ...(catalogParent ? { parent: catalogParent } : {}),
    };
  } catch {
    /* skip */
  }
  }
}

const twinfileRoot = resolveTwinfileRoot(examplesRoot);
const storyExamplesRoot = resolveTypeExamplesRoot('story', twinfileRoot);

recordCatalogRoot(examplesRoot, 'catalog/place/examples');
if (statSync(storyExamplesRoot, { throwIfNoEntry: false })?.isDirectory()) {
  recordCatalogRoot(storyExamplesRoot, 'catalog/story/examples');
}
const eventExamplesRoot = resolveTypeExamplesRoot('event', twinfileRoot);
if (statSync(eventExamplesRoot, { throwIfNoEntry: false })?.isDirectory()) {
  recordCatalogRoot(eventExamplesRoot, 'catalog/event/examples');
}

const byKind = {};
for (const [ref, row] of Object.entries(refs)) {
  const kind = row.kind ?? 'unknown';
  if (!byKind[kind]) byKind[kind] = [];
  byKind[kind].push(ref);
}
for (const kind of Object.keys(byKind)) {
  byKind[kind].sort();
}

writeFileSync(
  join(examplesRoot, 'published-refs.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), refs, catalog: { byKind } }, null, 2)}\n`,
);
console.log(`record-published-refs ok (${Object.keys(refs).length} refs)`);
