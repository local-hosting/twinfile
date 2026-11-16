#!/usr/bin/env node
/** Scaffold `src/builtins/<id>/` for a new built-in format. */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2]?.trim();
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error('usage: node scripts/scaffold-builtin-bridge.mjs <id>');
  process.exit(1);
}

const dir = join(root, 'src', 'builtins', id);
if (existsSync(dir)) {
  console.error(`already exists: ${dir}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

writeFileSync(
  join(dir, 'import.ts'),
  `import { asImportRecord, packPlaceUnit, type ImportResult } from '../../authoring.js';

export function importPlace(input: unknown): ImportResult {
  const root = asImportRecord(input, '${id}');
  void root;
  throw new Error('${id}: importPlace not implemented');
}
`,
);

writeFileSync(
  join(dir, 'index.ts'),
  `import type { TwinBridge } from '../../types.js';
import { importPlace } from './import.js';

export const bridge: TwinBridge = {
  id: '${id}',
  crosswalkSource: '${id}',
  roles: ['import'],
  importPlace,
};
`,
);

console.log(`scaffolded src/builtins/${id}/ — add crosswalk + spec fixture, then register in resolve-bridge.ts`);
