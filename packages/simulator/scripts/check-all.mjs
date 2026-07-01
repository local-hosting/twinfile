#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const simulatorRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = join(simulatorRoot, 'events.registry.json');
if (!existsSync(registryPath)) {
  console.error('check-all: missing events.registry.json (checked in at the simulator root)');
  process.exit(1);
}
const rows = JSON.parse(readFileSync(registryPath, 'utf8'));
if (!Array.isArray(rows) || rows.length < 1) {
  console.error('check-all: events.registry.json is empty');
  process.exit(1);
}
for (const row of rows) {
  if (!row?.id || !row?.name) {
    console.error('check-all: invalid registry row', row);
    process.exit(1);
  }
}
console.log(`check-all ok (${rows.length} place events)`);
