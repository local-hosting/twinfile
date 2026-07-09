#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const specRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const vocabPath = join(specRoot, 'conf', 'role-vocabulary.yaml');
const allowedKinds = new Set([
  'space',
  'opening',
  'asset',
  'sensor',
  'ai',
  'role',
  'marker',
  'gauge',
  'station',
]);

const doc = parseYaml(readFileSync(vocabPath, 'utf8'));
const roles = doc?.roles;
if (!Array.isArray(roles) || roles.length === 0) {
  console.error('check-situation-role-vocabulary: missing roles');
  process.exit(1);
}

const byId = new Map();
for (const row of roles) {
  const id = row?.id;
  const kind = row?.kind;
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(id)) {
    console.error(`check-situation-role-vocabulary: bad id ${JSON.stringify(id)}`);
    process.exit(1);
  }
  if (byId.has(id)) {
    console.error(`check-situation-role-vocabulary: duplicate id ${id}`);
    process.exit(1);
  }
  if (typeof kind !== 'string' || !allowedKinds.has(kind)) {
    console.error(`check-situation-role-vocabulary: bad kind for ${id}`);
    process.exit(1);
  }
  if (row.mode !== 'daily' && row.mode !== 'resilience') {
    console.error(`check-situation-role-vocabulary: mode for ${id} must be daily or resilience`);
    process.exit(1);
  }
  byId.set(id, kind);
}

function scanExpects(doc, label) {
  const expects = doc?.expects;
  if (!expects || typeof expects !== 'object') return;
  for (const [key, spec] of Object.entries(expects)) {
    const entry = byId.get(key);
    if (!entry) {
      console.error(`${label}: expects key ${key} not in vocabulary`);
      process.exit(1);
    }
    if (spec?.kind !== entry) {
      console.error(`${label}: expects ${key} kind ${spec?.kind} != vocabulary ${entry}`);
      process.exit(1);
    }
  }
}

const eventExamplesRoot = join(specRoot, '..', '..', 'catalog', 'event', 'examples');

function eventHeadPath(id) {
  return join(eventExamplesRoot, id, `${id}.twin.yaml`);
}

function situationCatalogPresent(situation) {
  return statSync(eventHeadPath(situation), { throwIfNoEntry: false })?.isFile() === true;
}

for (const id of readdirSync(eventExamplesRoot)) {
  if (!situationCatalogPresent(id)) continue;
  scanExpects(parseYaml(readFileSync(eventHeadPath(id), 'utf8')), `catalog/event/${id}`);
}

const catalogPath = join(specRoot, 'conf', 'hazard-catalog.yaml');
if (statSync(catalogPath, { throwIfNoEntry: false })?.isFile()) {
  const catalog = parseYaml(readFileSync(catalogPath, 'utf8'));
  const hazards = catalog?.hazards;
  if (!Array.isArray(hazards) || hazards.length === 0) {
    console.error('check-situation-role-vocabulary: hazard-catalog missing hazards');
    process.exit(1);
  }
  const seenHazard = new Set();
  for (const row of hazards) {
    const id = row?.id;
    if (typeof id !== 'string' || !id) {
      console.error('check-situation-role-vocabulary: hazard-catalog row missing id');
      process.exit(1);
    }
    if (seenHazard.has(id)) {
      console.error(`check-situation-role-vocabulary: duplicate hazard id ${id}`);
      process.exit(1);
    }
    seenHazard.add(id);
    const situation = row?.situation;
    if (situation === null || situation === undefined) continue;
    if (typeof situation !== 'string' || !situation) {
      console.error(`check-situation-role-vocabulary: bad situation for hazard ${id}`);
      process.exit(1);
    }
    if (!situationCatalogPresent(situation)) {
      console.error(
        `check-situation-role-vocabulary: missing simulator situation ${situation} (hazard ${id})`,
      );
      process.exit(1);
    }
  }
}

const crosswalkPath = join(specRoot, 'conf', 'hr-marker-crosswalk.yaml');
if (statSync(crosswalkPath, { throwIfNoEntry: false })?.isFile()) {
  const cross = parseYaml(readFileSync(crosswalkPath, 'utf8'));
  const reports = cross?.reports;
  const sites = cross?.sites;
  if (!Array.isArray(reports) || !Array.isArray(sites)) {
    console.error('check-situation-role-vocabulary: humanitarian crosswalk missing reports/sites');
    process.exit(1);
  }
  for (const row of reports) {
    const situation = row?.situation;
    if (typeof situation !== 'string' || !situation) {
      console.error('check-situation-role-vocabulary: crosswalk report missing situation');
      process.exit(1);
    }
    if (!situationCatalogPresent(situation)) {
      console.error(`check-situation-role-vocabulary: crosswalk missing simulator situation ${situation}`);
      process.exit(1);
    }
  }
  for (const row of sites) {
    const role = row?.role;
    if (typeof role !== 'string' || !byId.has(role)) {
      console.error(`check-situation-role-vocabulary: crosswalk site role ${JSON.stringify(role)} not in vocabulary`);
      process.exit(1);
    }
  }
}

console.log(`check-situation-role-vocabulary ok (${byId.size} roles)`);
