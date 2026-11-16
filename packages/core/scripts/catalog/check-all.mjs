#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { resolveExamplesCatalogRoot } from './resolve-examples-catalog-root.mjs';

const require = createRequire(import.meta.url);
const examplesRoot = resolveExamplesCatalogRoot(import.meta.url);
const specRoot = dirname(require.resolve('@doppler-group/twinfile-spec/package.json'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

function collectSchemas(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collectSchemas(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

for (const file of collectSchemas(join(specRoot, 'schemas', '1'))) {
  ajv.addSchema(JSON.parse(readFileSync(file, 'utf8')));
}

function findTwinfiles(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) findTwinfiles(p, acc);
    else if (name === 'Twinfile.yaml' || name === 'twinfile.yaml')
      acc.push(p);
  }
  return acc;
}

const manifests = findTwinfiles(examplesRoot);
if (!manifests.length) {
  console.error('check-all: no Twinfiles under examples repo');
  process.exit(1);
}

const validate = ajv.getSchema('https://twinfile.org/schemas/1/twinfile/twinfile.schema.json');
if (!validate) {
  console.error('check-all: missing twinfile.schema.json from @doppler-group/twinfile-spec');
  process.exit(1);
}

for (const path of manifests) {
  const doc = parseYaml(readFileSync(path, 'utf8'));
  if (!validate(doc)) {
    console.error(`check-all failed ${path}:`, ajv.errorsText(validate.errors));
    process.exit(1);
  }
}

console.log(`check-all ok (${manifests.length} Twinfiles)`);
