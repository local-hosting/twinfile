#!/usr/bin/env node
/**
 * Mechanical rename: @twinfile/* → @local-hosting/twinfile-* (and geotypes/geokit).
 * Skips node_modules, dist, .git, yarn.lock.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] ?? join(import.meta.dirname, '../..');

const REPLACEMENTS = [
  ['@local-hosting/geotypes', '@local-hosting/geotypes'],
  ['@local-hosting/geokit', '@local-hosting/geokit'],
  ['@local-hosting/twinfile-simulator', '@local-hosting/twinfile-simulator'],
  ['@local-hosting/twinfile-bridge', '@local-hosting/twinfile-bridge'],
  ['@local-hosting/twinfile-core', '@local-hosting/twinfile-core'],
  ['@local-hosting/twinfile', '@local-hosting/twinfile'],
  ['@local-hosting/twinfile-character', '@local-hosting/twinfile-character'],
  ['@local-hosting/twinfile-character', '@local-hosting/twinfile-character'],
  ['@local-hosting/twinfile-story', '@local-hosting/twinfile-story'],
  ['@local-hosting/twinfile-core', '@local-hosting/twinfile-core'],
  ['@local-hosting/twinfile-cli', '@local-hosting/twinfile-cli'],
];

const SKIP = new Set(['node_modules', 'dist', '.git', '.next', 'yarn.lock']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    try {
      const st = statSync(p);
      if (st.isDirectory()) walk(p, files);
      else if (/\.(json|ts|tsx|mjs|js|md|mdx|yml|yaml)$/.test(name)) files.push(p);
    } catch {
      // skip
    }
  }
  return files;
}

function rewrite(content) {
  let out = content;
  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  out = out.replaceAll('ghcr.io/local-hosting/twinfile/', 'ghcr.io/local-hosting/twinfile/');
  out = out.replaceAll("defaultRegistry ?? 'ghcr.io/local-hosting'", "defaultRegistry ?? 'ghcr.io/local-hosting'");
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = readFileSync(file, 'utf8');
  const after = rewrite(before);
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
  }
}
console.log(`rename-scope: updated ${changed} files under ${ROOT}`);