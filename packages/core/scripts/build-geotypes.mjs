#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveGeotypesRoot } from './resolve-geotypes-root.mjs';

const coreRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const linkedDist = path.join(coreRoot, 'node_modules/@doppler-group/geotypes/dist/index.d.ts');
if (existsSync(linkedDist)) {
  console.log('build-geotypes: skip (registry or linked package already has dist)');
  process.exit(0);
}

const geotypesRoot = resolveGeotypesRoot();
if (!geotypesRoot) {
  console.error('build-geotypes: no geotypes checkout (set TF_GEOTYPES_ROOT or clone sibling)');
  process.exit(1);
}

const install = spawnSync('yarn', ['install', '--no-immutable'], {
  cwd: geotypesRoot,
  stdio: 'inherit',
  env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: '0' },
});
if (install.status !== 0) {
  process.exit(install.status ?? 1);
}

const r = spawnSync('yarn', ['build'], { cwd: geotypesRoot, stdio: 'inherit' });
process.exit(r.status ?? 1);
