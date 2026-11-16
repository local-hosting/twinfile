#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');
const EMIT_SUFFIX = ['.js', '.d.ts', '.d.ts.map', '.js.map'];

function findEmit(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      findEmit(full, hits);
      continue;
    }
    if (EMIT_SUFFIX.some((suffix) => name.endsWith(suffix))) {
      hits.push(full);
    }
  }
  return hits;
}

const stray = findEmit(srcRoot);
if (stray.length > 0) {
  console.error(
    `check-no-src-emit: found ${stray.length} file(s) under src/ (use yarn build → dist/):\n${stray.join('\n')}`,
  );
  process.exit(1);
}

console.log('check-no-src-emit ok');
