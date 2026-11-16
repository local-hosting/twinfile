#!/usr/bin/env node
/** Fail if a Yarn workspace member has its own yarn.lock (breaks `yarn workspace` / nested installs). */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const workspaces = pkg.workspaces ?? [];

const nested = [];
for (const pattern of workspaces) {
  const base = pattern.includes('*') ? null : join(root, pattern);
  if (!base || !existsSync(base)) continue;
  const lock = join(base, 'yarn.lock');
  if (existsSync(lock)) nested.push(pattern);
}

if (nested.length > 0) {
  console.error('nested yarn.lock in workspace members (remove; use root yarn.lock only):');
  for (const w of nested) console.error(`  - ${w}/yarn.lock`);
  process.exit(1);
}

console.log('check-nested-yarn ok');
