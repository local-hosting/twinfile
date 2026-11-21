#!/usr/bin/env node
/**
 * One-shot filesystem cleanup before first push (safe to re-run).
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const nestedNodeModules = [
  join(root, 'place/node_modules'),
  join(root, 'resource/node_modules'),
  join(root, 'character/node_modules'),
  join(root, 'story/node_modules'),
];

for (const dir of nestedNodeModules) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`removed ${dir.replace(root, '.')}`);
  }
}

for (const legacy of ['place', 'resource', 'character', 'story']) {
  const legacyRoot = join(root, legacy);
  if (!existsSync(legacyRoot)) continue;
  const leftover = readdirSync(legacyRoot);
  if (leftover.length === 0) {
    rmdirSync(legacyRoot);
    console.log(`removed empty legacy ${legacy}/`);
  }
}

try {
  execSync(
    `find . -name .DS_Store -not -path './node_modules/*' -not -path './.yarn/*' -delete`,
    { cwd: root, stdio: 'inherit' },
  );
  console.log('removed .DS_Store (outside node_modules)');
} catch {
  console.warn('find .DS_Store failed (non-fatal)');
}

const pruneScript = join(dirname(fileURLToPath(import.meta.url)), 'prune-legacy-layout.mjs');
if (existsSync(pruneScript)) {
  execSync(`node ${JSON.stringify(pruneScript)}`, { cwd: root, stdio: 'inherit' });
}

console.log('repo-hygiene ok');