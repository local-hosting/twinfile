#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'src');

function s(codes) {
  return String.fromCharCode(...codes);
}

/** Open-stack src deny substrings — rule ids only in CI output. */
const RULES = [
  {
    id: 1,
    needles: [s([108, 111, 99, 107, 101, 114])],
    allowPrefix: s([98, 97, 103, 103, 97, 103, 101, 95]),
  },
  { id: 2, needles: [s([116, 119, 105, 110, 102, 105, 108, 101, 45, 108, 111, 99, 107, 101, 114])] },
  { id: 3, needles: [s([114, 101, 112, 108, 105, 99, 97, 116, 105, 111, 110])] },
  { id: 4, needles: [s([64, 116, 119, 105, 110, 102, 105, 108, 101, 47, 118, 108, 109])] },
];

function listSourceFiles(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) listSourceFiles(full, acc);
    else if (/\.(ts|mts)$/.test(name) && !name.endsWith('.d.ts')) acc.push(full);
  }
  return acc;
}

function lineMatchesRule(line, rule) {
  const lower = line.toLowerCase();
  for (const needle of rule.needles) {
    const n = needle.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(n, idx)) !== -1) {
      if (rule.allowPrefix && idx >= rule.allowPrefix.length) {
        const prefix = lower.slice(idx - rule.allowPrefix.length, idx);
        if (prefix === rule.allowPrefix.toLowerCase()) {
          idx += n.length;
          continue;
        }
      }
      return true;
    }
  }
  return false;
}

const violations = listSourceFiles(srcRoot).flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      RULES.filter((rule) => lineMatchesRule(line, rule)).map(
        (rule) => `${path.relative(root, file)}:${index + 1} [rule ${rule.id}] ${line.trim()}`,
      ),
    ),
);

if (violations.length > 0) {
  console.error(`check-open-standard failed (${violations.length}):\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('check-open-standard ok');
