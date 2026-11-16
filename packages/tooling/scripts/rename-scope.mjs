#!/usr/bin/env node
/**
 * Mechanical rename: @twinfile/* → @doppler-group/twinfile-* (and geotypes/geokit).
 * Skips node_modules, dist, .git, yarn.lock.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] ?? join(import.meta.dirname, '../..');

const REPLACEMENTS = [
  ['@doppler-group/geotypes', '@doppler-group/geotypes'],
  ['@doppler-group/geokit', '@doppler-group/geokit'],
  ['@doppler-group/twinfile-simulator', '@doppler-group/twinfile-simulator'],
  ['@doppler-group/twinfile-bridge', '@doppler-group/twinfile-bridge'],
  ['@doppler-group/twinfile-core', '@doppler-group/twinfile-core'],
  ['@doppler-group/twinfile-spec', '@doppler-group/twinfile-spec'],
  ['@doppler-group/twinfile-character', '@doppler-group/twinfile-character'],
  ['@doppler-group/twinfile-character', '@doppler-group/twinfile-character'],
  ['@doppler-group/twinfile-story', '@doppler-group/twinfile-story'],
  ['@doppler-group/twinfile-core', '@doppler-group/twinfile-core'],
  ['@doppler-group/twinfile-cli', '@doppler-group/twinfile-cli'],
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
  out = out.replaceAll('ghcr.io/doppler-group/twinfile/', 'ghcr.io/doppler-group/twinfile/');
  out = out.replaceAll("defaultRegistry ?? 'ghcr.io/doppler-group'", "defaultRegistry ?? 'ghcr.io/doppler-group'");
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