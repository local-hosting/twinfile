#!/usr/bin/env node
/** Build viewer if needed, then serve default catalogs (examples + simulator). */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const simulatorRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const twinfileRoot = join(simulatorRoot, '..');
const viewerRoot = join(simulatorRoot, 'viewer');
const cli = join(viewerRoot, 'dist/cli.js');
const staticIndex = join(viewerRoot, 'dist/static/index.html');
const tsc = join(twinfileRoot, 'node_modules/.bin/tsc');

const args = process.argv.slice(2);
const skipBuild = args.includes('--no-build') || process.env.TF_VIEWER_SKIP_BUILD === '1';
const forward = args.filter((a) => a !== '--no-build');

function buildViewer() {
  if (!existsSync(tsc)) {
    console.error('viewer: missing tsc — run `yarn install` from the twinfile repo root');
    process.exit(1);
  }
  const compile = spawnSync(tsc, ['-p', 'viewer/tsconfig.build.json'], {
    cwd: simulatorRoot,
    stdio: 'inherit',
  });
  if (compile.status !== 0) process.exit(compile.status ?? 1);
  const copy = spawnSync(process.execPath, [join(viewerRoot, 'scripts/copy-static.mjs')], {
    cwd: simulatorRoot,
    stdio: 'inherit',
  });
  if (copy.status !== 0) process.exit(copy.status ?? 1);
}

if (!skipBuild || !existsSync(cli) || !existsSync(staticIndex)) {
  buildViewer();
}

const run = spawnSync(process.execPath, [cli, ...forward], {
  cwd: simulatorRoot,
  stdio: 'inherit',
  env: process.env,
});
process.exit(run.status ?? 1);
