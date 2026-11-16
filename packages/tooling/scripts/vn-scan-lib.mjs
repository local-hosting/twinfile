#!/usr/bin/env node
/**
 * Scan a package tree for closed-host product references.
 * Deny tokens live in ENCODED (base64); CI reports rule ids only.
 *
 * Monorepo: edit this file; packages run `node ../tooling/scripts/check-vendor-neutral.mjs`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Opaque deny payloads — not a published plain-language list. */
const ENCODED = [
  'ZmllbGR3aXNl',
  'ZmllbGR3aXNlLXNoYXBlcw==',
  'dHJ1c3RiYXNl',
  'ZG9wcGxlciBnbG9iZQ==',
  'Y29yaW8tcGxhdGZvcm1z',
  'QGNvcmlvLw==',
  'Z2l0aHViLmNvbS9jb3Jpbw==',
  'Y29yaW8gbW9ub3JlcG8=',
  'Y29yaW8gcGxhdGZvcm1z',
  'YWNjb3JkLWxhYnM=',
  'YWNjb3JkIGxhYnM=',
  'c3BlY3RydW0=',
  'c2hhcmVwb3J0',
  'cmFsbHk=',
  'Y2xheSBvcGVu',
  'Y2xheSB3b3Jrc3BhY2U=',
];

/** @type {ReadonlyArray<readonly [number, string]>} */
const VENDOR_NEUTRAL_RULES = ENCODED.map((encoded, index) => [
  index + 1,
  Buffer.from(encoded, 'base64').toString('utf8'),
]);

const DEFAULT_SKIP_DIR = new Set(['node_modules', '.git', '.yarn', 'dist', 'coverage', '.next']);
const DEFAULT_SKIP_FILES = new Set([
  'scripts/check-vendor-neutral.mjs',
  'scripts/vn-scan-lib.mjs',
]);

function walk(dir, root, skipDir, skipRelPrefixes, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDir.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    const rel = relative(root, path);
    if (st.isDirectory()) {
      if (skipRelPrefixes.some((prefix) => rel === prefix || rel.startsWith(`${prefix}/`))) continue;
      walk(path, root, skipDir, skipRelPrefixes, out);
    } else if (st.isFile()) out.push(path);
  }
  return out;
}

function lineHitsRules(line) {
  const lower = line.toLowerCase();
  for (const [ruleId, needle] of VENDOR_NEUTRAL_RULES) {
    if (lower.includes(needle.toLowerCase())) return ruleId;
  }
  return null;
}

/**
 * @param {object} opts
 * @param {string} opts.root Package root to scan
 * @param {string[]} [opts.skipRelPrefixes]
 * @param {Set<string>} [opts.skipFiles]
 */
export function runVendorNeutralScan(opts) {
  const { root, skipRelPrefixes = [], skipFiles = DEFAULT_SKIP_FILES } = opts;
  const hits = [];
  for (const file of walk(root, root, DEFAULT_SKIP_DIR, skipRelPrefixes)) {
    const rel = relative(root, file);
    if (skipFiles.has(rel)) continue;
    if (rel === '.env' || rel.startsWith('.env.')) continue;
    if (file.endsWith('.png') || file.endsWith('.gz') || file.endsWith('.woff2')) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const ruleId = lineHitsRules(lines[i]);
      if (ruleId !== null) {
        hits.push(`${rel}:${i + 1}: prohibited reference (rule ${ruleId})`);
        break;
      }
    }
  }
  return hits;
}

/** @param {string} packageRoot @param {string[]} [skipRelPrefixes] */
export function runVendorNeutralCli(packageRoot, skipRelPrefixes = []) {
  const hits = runVendorNeutralScan({ root: packageRoot, skipRelPrefixes });
  if (hits.length > 0) {
    console.error(`check-vendor-neutral failed (${hits.length}):\n${hits.join('\n')}`);
    process.exit(1);
  }
  console.log('check-vendor-neutral ok');
}
