#!/usr/bin/env node
/** Regenerate src/generated/patch-module-types-data.ts from @doppler-group/twinfile-spec conf/patch-module-types.yaml */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import yaml from 'yaml';

const require = createRequire(import.meta.url);
const coreRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const specRoot = dirname(require.resolve('@doppler-group/twinfile-spec/package.json'));
const sourcePath = join(specRoot, 'conf', 'patch-module-types.yaml');
const outDir = join(coreRoot, 'src', 'generated');
const outPath = join(outDir, 'patch-module-types-data.ts');

const raw = readFileSync(sourcePath, 'utf8');
const doc = yaml.parse(raw);
const moduleTypes = doc?.module_types;
if (!moduleTypes || typeof moduleTypes !== 'object') {
  console.error('sync-patch-module-types: expected module_types map');
  process.exit(1);
}

const wires = new Set();
const typeIds = Object.keys(moduleTypes).sort();

for (const [typeId, def] of Object.entries(moduleTypes)) {
  const ports = def?.ports;
  if (!ports || typeof ports !== 'object') {
    console.error(`sync-patch-module-types: ${typeId} missing ports`);
    process.exit(1);
  }
  for (const port of Object.values(ports)) {
    const wire = port?.wire;
    if (typeof wire !== 'string' || wire.length === 0) {
      console.error(`sync-patch-module-types: ${typeId} port missing wire`);
      process.exit(1);
    }
    wires.add(wire);
  }
}

const wireList = [...wires].sort();
const header = `/** Generated from @doppler-group/twinfile-spec conf/patch-module-types.yaml — run \`node scripts/sync-patch-module-types.mjs\`. */\n`;

const body = `${header}
export const PATCH_WIRES = ${JSON.stringify(wireList, null, 2)} as const;

export type PatchWire = (typeof PATCH_WIRES)[number];

export const PATCH_MODULE_TYPE_IDS = ${JSON.stringify(typeIds, null, 2)} as const;

export type PatchModuleTypeId = (typeof PATCH_MODULE_TYPE_IDS)[number];

export function isPatchWire(value: string): value is PatchWire {
  return (PATCH_WIRES as readonly string[]).includes(value);
}

export function isPatchModuleTypeId(value: string): value is PatchModuleTypeId {
  return (PATCH_MODULE_TYPE_IDS as readonly string[]).includes(value);
}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, body);
console.log(`sync-patch-module-types: wrote ${wireList.length} wires, ${typeIds.length} module types`);
