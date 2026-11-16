#!/usr/bin/env node
/**
 * Run workspace checks from the twinfile root (open stack only — not productgrade).
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Run a workspace script from the monorepo root (avoids nested `yarn.lock` in package dirs). */
function runWorkspaceScript(packageName, scriptArgs) {
  return spawnSync('yarn', ['workspace', packageName, 'run', ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runNodeScript(relDir, scriptName) {
  return spawnSync(process.execPath, [join(root, relDir, 'scripts', scriptName)], {
    cwd: join(root, relDir),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const geotypesRoot = join(root, '../geotypes');
const geotypesScript = join(geotypesRoot, 'scripts/check-all.mjs');

/** Dependency order: each package typechecks against the `dist/` of the ones before it. */
const BUILD_ORDER = [
  '@doppler-group/twinfile-bridge',
  '@doppler-group/twinfile-core',
  '@doppler-group/twinfile-place',
  '@doppler-group/twinfile-simulator',
  '@doppler-group/twinfile-cli',
];

function buildWorkspaces() {
  for (const name of BUILD_ORDER) {
    const result = runWorkspaceScript(name, ['build']);
    if (result.status !== 0) return result;
  }
  return { status: 0, stdout: '', stderr: '' };
}

const STEPS = [
  { id: 'build', run: buildWorkspaces },
  ...(existsSync(geotypesScript)
    ? [
        {
          id: 'geotypes',
          run: () =>
            spawnSync(process.execPath, [geotypesScript], {
              cwd: geotypesRoot,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
            }),
        },
      ]
    : []),
  { id: 'spec', run: () => runWorkspaceScript('@doppler-group/twinfile-spec', ['check']) },
  { id: 'bridge', run: () => runWorkspaceScript('@doppler-group/twinfile-bridge', ['check']) },
  { id: 'core', run: () => runWorkspaceScript('@doppler-group/twinfile-core', ['check:openstack']) },
  { id: 'cli', run: () => runWorkspaceScript('@doppler-group/twinfile-cli', ['check']) },
  { id: 'simulator', run: () => runWorkspaceScript('@doppler-group/twinfile-simulator', ['check']) },
  { id: 'place-type', run: () => runWorkspaceScript('@doppler-group/twinfile-place', ['check']) },
  { id: 'resource-type', run: () => runWorkspaceScript('@doppler-group/twinfile-resource', ['check']) },
  { id: 'character-type', run: () => runWorkspaceScript('@doppler-group/twinfile-character', ['check']) },
  { id: 'story-type', run: () => runWorkspaceScript('@doppler-group/twinfile-story', ['check']) },
];

function parseOnly(argv) {
  const idx = argv.indexOf('--only');
  if (idx < 0) return null;
  return argv[idx + 1]?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
}

const only = parseOnly(process.argv.slice(2));
const steps = only ? STEPS.filter((s) => only.includes(s.id)) : STEPS;

if (only && steps.length !== only.length) {
  const missing = only.filter((id) => !STEPS.some((s) => s.id === id));
  console.error(`check-workspace: unknown step id(s): ${missing.join(', ')}`);
  process.exit(1);
}

let failed = 0;
for (const step of steps) {
  const result = step.run();
  if (result.status !== 0) {
    failed += 1;
    console.error(`\ncheck-workspace: FAIL ${step.id}`);
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  } else {
    console.log(`ok ${step.id}`);
  }
}

if (failed > 0) {
  console.error(`\ncheck-workspace: ${failed} failure(s)`);
  process.exit(1);
}

console.log('check-workspace ok');
