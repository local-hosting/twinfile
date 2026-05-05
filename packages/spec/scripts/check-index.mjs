#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const specRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(readFileSync(join(specRoot, 'conf', 'index.json'), 'utf8'));

const minimumByCategory = {
  schema: 30,
  merge: 2,
  digest: 2,
  contract: 1,
  refs: 1,
  runner: 1,
  layers: 1,
  time: 1,
};

const counts = {};
for (const vector of index.vectors) {
  counts[vector.category] = (counts[vector.category] ?? 0) + 1;
  const file = join(specRoot, vector.files[0]);
  if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
    console.error(`check-index: missing file for ${vector.id}: ${vector.files[0]}`);
    process.exit(1);
  }
}

let failed = 0;
for (const [category, min] of Object.entries(minimumByCategory)) {
  const n = counts[category] ?? 0;
  if (n < min) {
    console.error(`check-index: category ${category} has ${n} vectors, need at least ${min}`);
    failed += 1;
  }
}

if (failed > 0) process.exit(1);
console.log(`check-index ok (${index.vectors.length} vectors indexed)`);
