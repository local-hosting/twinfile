#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['node_modules', '.git', '.yarn', '.DS_Store']);

/** Layout limits for spec tree (conf grows with conformance categories). */
const MAX_DIRS = 12;
const MAX_LOOSE = 9;
const MAX_SEG = 24;

function looseCount(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isFile()) n += 1;
  }
  return n;
}

function dirCount(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += 1;
  }
  return n;
}

function walk(dir, rel = '') {
  const issues = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    if (name.length > MAX_SEG) {
      issues.push(`${join(rel, name)}: segment longer than ${MAX_SEG}`);
    }
  }
  if (statSync(dir).isDirectory()) {
    const subdirs = dirCount(dir);
    const loose = looseCount(dir);
    if (subdirs > MAX_DIRS) {
      issues.push(`${rel || '.'}: ${subdirs} subdirs (max ${MAX_DIRS})`);
    }
    if (loose > MAX_LOOSE) {
      issues.push(`${rel || '.'}: ${loose} loose files (max ${MAX_LOOSE})`);
    }
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        issues.push(...walk(p, join(rel, name)));
      }
    }
  }
  return issues;
}

const targets = ['doc', 'schemas', 'conf', 'rfcs', 'scripts'].map((d) => join(root, d));
const all = targets.flatMap((d) => walk(d, relative(root, d)));

if (all.length) {
  console.error('check-layout failed:\n' + all.map((l) => `  - ${l}`).join('\n'));
  process.exit(1);
}
console.log('check-layout ok');
