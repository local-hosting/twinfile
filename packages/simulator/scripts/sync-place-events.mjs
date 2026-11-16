#!/usr/bin/env node
/** Generate simulator/src/catalog/builtin TypeScript modules from situation Twinfile heads. */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const simulatorRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const situationsDir = join(simulatorRoot, 'situations');
const eventsDir = join(simulatorRoot, 'src', 'catalog', 'builtin');

function jsString(s) {
  return JSON.stringify(s);
}

function emitEventModule(id, doc) {
  const lines = [
    `import { definePlaceEvent } from '../place-event-request.js';`,
    '',
    `export const ${id.replace(/-/g, '_')} = definePlaceEvent({`,
    `  id: ${jsString(doc.id ?? id)},`,
    `  name: ${jsString(doc.name ?? id)},`,
    `  version: ${jsString(doc.version ?? '1.0.0')},`,
  ];
  if (doc.stability) lines.push(`  stability: ${jsString(doc.stability)},`);
  lines.push(`  catalogKind: 'situation',`);
  if (Array.isArray(doc.phases) && doc.phases.length) {
    lines.push(`  phases: ${jsString(doc.phases)},`);
  }
  if (doc.expects && typeof doc.expects === 'object') {
    lines.push(`  expects: ${JSON.stringify(doc.expects, null, 2).replaceAll('\n', '\n  ')},`);
  }
  if (doc.args && typeof doc.args === 'object') {
    lines.push(`  args: ${JSON.stringify(doc.args, null, 2).replaceAll('\n', '\n  ')},`);
  }
  if (doc.catalog && typeof doc.catalog === 'object') {
    lines.push(`  catalog: ${JSON.stringify(doc.catalog, null, 2).replaceAll('\n', '\n  ')},`);
  }
  lines.push(`});`, '');
  return lines.join('\n');
}

mkdirSync(eventsDir, { recursive: true });
const ids = [];
for (const name of readdirSync(situationsDir).sort()) {
  const twinPath = join(situationsDir, name, 'Twinfile.yaml');
  let raw;
  try {
    raw = readFileSync(twinPath, 'utf8');
  } catch {
    continue;
  }
  const doc = yaml.load(raw);
  if (!doc || typeof doc !== 'object') continue;
  const id = doc.id ?? name;
  ids.push(id);
  writeFileSync(join(eventsDir, `${id}.ts`), emitEventModule(id, doc));
}

const indexLines = [
  `import { createEventCatalog } from '@doppler-group/twinfile-core';`,
  '',
  ...ids.map((id) => `import { ${id.replace(/-/g, '_')} } from './${id}.js';`),
  '',
  `export const simulatorPlaceEventsCatalog = createEventCatalog().registerMany([`,
  ...ids.map((id) => `  ${id.replace(/-/g, '_')},`),
  `]);`,
  '',
  `export function registerSimulatorEvents(): typeof simulatorPlaceEventsCatalog {`,
  `  return simulatorPlaceEventsCatalog;`,
  `}`,
  '',
];

writeFileSync(join(eventsDir, 'index.ts'), indexLines.join('\n'));

const registryRows = [];
for (const name of readdirSync(situationsDir).sort()) {
  const twinPath = join(situationsDir, name, 'Twinfile.yaml');
  let raw;
  try {
    raw = readFileSync(twinPath, 'utf8');
  } catch {
    continue;
  }
  const doc = yaml.load(raw);
  if (!doc || typeof doc !== 'object') continue;
  registryRows.push({
    id: doc.id ?? name,
    name: doc.name ?? name,
    version: doc.version ?? '1.0.0',
    stability: doc.stability,
    catalogKind: 'situation',
    phases: doc.phases,
    expects: doc.expects,
    args: doc.args,
    catalog: doc.catalog,
  });
}
writeFileSync(join(simulatorRoot, 'events.registry.json'), `${JSON.stringify(registryRows, null, 2)}\n`);
console.log(`Wrote ${ids.length} place events to ${eventsDir}`);
