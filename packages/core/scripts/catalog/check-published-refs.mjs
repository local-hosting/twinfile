#!/usr/bin/env node
/** Fail CI when published-refs drifts from local builds (optional gate). */
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePlaceExamplesCatalogRoot } from '../../dist/index.js';

const examplesRoot = resolvePlaceExamplesCatalogRoot();

const refsPath = join(examplesRoot, 'published-refs.json');
if (!statSync(refsPath, { throwIfNoEntry: false })?.isFile()) {
  console.log('check-published-refs: skip (no published-refs.json)');
  process.exit(0);
}

const before = JSON.parse(readFileSync(refsPath, 'utf8'));
const scriptsDir = dirname(fileURLToPath(import.meta.url));
const gen = spawnSync(process.execPath, [join(scriptsDir, 'record-published-refs.mjs')], {
  encoding: 'utf8',
});

if (gen.status !== 0) {
  console.error(gen.stderr || gen.stdout);
  process.exit(1);
}

const after = JSON.parse(readFileSync(refsPath, 'utf8'));
const drift = [];
const keys = new Set([...Object.keys(before.refs ?? {}), ...Object.keys(after.refs ?? {})]);
for (const ref of [...keys].sort()) {
  const a = before.refs?.[ref];
  const b = after.refs?.[ref];
  if (JSON.stringify(a) !== JSON.stringify(b)) drift.push(ref);
}
if (drift.length) {
  console.error(
    'check-published-refs: digest drift (run publish or commit updated catalog/place/examples/published-refs.json):\n',
    drift.join('\n'),
  );
  process.exit(1);
}
console.log('check-published-refs ok');