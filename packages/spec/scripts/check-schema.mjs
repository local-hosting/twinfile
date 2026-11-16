#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaRoot = join(root, 'schemas', '1');

function collectSchemas(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collectSchemas(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

for (const file of collectSchemas(schemaRoot)) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  ajv.addSchema(doc);
}

function loadData(path) {
  const raw = readFileSync(path, 'utf8');
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return yaml.load(raw);
  return JSON.parse(raw);
}

function validateVector(entry, expectPass) {
  const data = loadData(join(root, entry.files[0]));
  const schemaId = entry.schema;
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`unknown schema ${schemaId}`);
  const ok = validate(data);
  if (expectPass && !ok) {
    throw new Error(`${entry.id}: expected pass: ${ajv.errorsText(validate.errors)}`);
  }
  if (!expectPass && ok) {
    throw new Error(`${entry.id}: expected fail but passed`);
  }
}

const index = JSON.parse(readFileSync(join(root, 'conf', 'index.json'), 'utf8'));

for (const entry of index.vectors) {
  for (const rel of entry.files) {
    const p = join(root, rel);
    if (!statSync(p, { throwIfNoEntry: false })?.isFile()) {
      console.error(`check-schema: missing ${rel} for ${entry.id}`);
      process.exit(1);
    }
  }
}

for (const entry of index.vectors) {
  if (entry.category !== 'schema') continue;
  validateVector(entry, entry.expect === 'pass');
}

const coreRoot = join(root, '..', 'core');
const simulatorRoot = join(root, '..', 'simulator');
if (existsSync(join(coreRoot, 'package.json'))) {
  execSync('npx tsc -p tsconfig.build.json', { cwd: coreRoot, stdio: 'inherit' });
}
if (existsSync(join(simulatorRoot, 'package.json'))) {
  execSync('npx tsc -p tsconfig.build.json', { cwd: simulatorRoot, stdio: 'inherit' });
}
const cliRoot = join(root, '..', 'cli');
if (existsSync(join(cliRoot, 'package.json'))) {
  execSync('yarn workspace @doppler-group/twinfile-cli build', { cwd: join(root, '../..'), stdio: 'inherit' });
}

let mergeObjects;
let sha256Digest;
let createTimeline;
let resolveTrackFeeds;
let resolvePhaseStarts;
const coreBuild = existsSync(join(coreRoot, 'dist/build/merge.js'));
const simulatorBuild = existsSync(join(simulatorRoot, 'dist/index.js'));
if (coreBuild) {
  ({ mergeObjects } = await import(join(coreRoot, 'dist/build/merge.js')));
  ({ sha256Digest } = await import(join(coreRoot, 'dist/build/digest.js')));
}
if (simulatorBuild) {
  ({ createTimeline, resolveTrackFeeds, resolvePhaseStarts } = await import(
    join(simulatorRoot, 'dist/index.js')
  ));
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sameNumber(actual, expected) {
  if (expected === null) return actual === null;
  return typeof actual === 'number' && Math.abs(actual - expected) < 1e-6;
}

function checkTimeCase(id, c) {
  const merged = c.place ?? c.place_graph ?? c.merged;
  const phaseStarts =
    c.phaseStarts ??
    resolvePhaseStarts({
      clock: c.clock,
      events: c.events ?? [],
      resolvedArgs: c.resolvedArgs ?? {},
    });
  const feeds =
    c.feeds ??
    resolveTrackFeeds({
      mergedPlace: merged,
      tracks: merged.tracks ?? [],
      placeRoot: '.',
      clock: c.clock,
      seed: c.seed ?? 1,
      phaseStarts,
    });
  const timeline = createTimeline({
    clock: c.clock,
    timezone: c.timezone,
    location: c.location,
    mergedPlace: merged,
    feeds,
    seed: c.seed ?? 1,
  });
  const problems = [];
  for (const exp of c.expect) {
    const sample = timeline.at(exp.t);
    for (const [track, want] of Object.entries(exp.tracks ?? {})) {
      if (!sameNumber(sample.tracks[track], want)) {
        problems.push(`t=${exp.t} ${track} expected ${want} got ${sample.tracks[track]}`);
      }
    }
    for (const [track, want] of Object.entries(exp.known ?? {})) {
      if (!sameNumber(sample.known[track], want)) {
        problems.push(`t=${exp.t} known ${track} expected ${want} got ${sample.known[track]}`);
      }
    }
    if (exp.active) {
      const got = sample.active.map((a) => a.id);
      if (!deepEqual(got, exp.active)) problems.push(`t=${exp.t} active expected ${exp.active} got ${got}`);
    }
    if (exp.occupancy) {
      const pick = (row) => ({
        schedule: row.schedule,
        ...(row.space !== undefined ? { space: row.space } : {}),
        ...(row.opening !== undefined ? { opening: row.opening } : {}),
        ...(row.route !== undefined ? { route: row.route } : {}),
        ...(row.marker !== undefined ? { marker: row.marker } : {}),
      });
      const got = sample.occupancy.map(pick);
      const want = exp.occupancy.map(pick);
      if (!deepEqual(got, want)) {
        problems.push(`t=${exp.t} occupancy expected ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
      }
    }
    if (exp.visit_beats) {
      const got = sample.visit_beats.map((b) => ({ id: b.id, space: b.space, schedule: b.schedule }));
      if (!deepEqual(got, exp.visit_beats)) {
        problems.push(`t=${exp.t} visit_beats expected ${JSON.stringify(exp.visit_beats)} got ${JSON.stringify(got)}`);
      }
    }
    if (exp.range) {
      const v = sample.tracks[exp.range.track];
      if (typeof v !== 'number' || v < exp.range.min || v > exp.range.max) {
        problems.push(`t=${exp.t} ${exp.range.track} ${v} outside ${exp.range.min}..${exp.range.max}`);
      }
    }
  }
  if (problems.length) {
    console.error(`check-schema time failed ${id}/${c.id}:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
}

for (const entry of index.vectors) {
  if (entry.category === 'merge' || entry.category === 'digest' || entry.category === 'time') {
    if (!coreBuild) {
      console.warn(`check-schema: skip ${entry.id} (no @doppler-group/twinfile-core build)`);
      continue;
    }
  }
  if (entry.category === 'merge') {
    const fixture = JSON.parse(readFileSync(join(root, entry.files[0]), 'utf8'));
    const cases = fixture.cases ?? [fixture];
    for (const c of cases) {
      const merged = mergeObjects(c.base, c.patch);
      if (!deepEqual(merged, c.expect)) {
        console.error(`check-schema merge failed ${entry.id}`);
        process.exit(1);
      }
    }
  }
  if (entry.category === 'time') {
    const fixture = JSON.parse(readFileSync(join(root, entry.files[0]), 'utf8'));
    for (const c of fixture.cases) checkTimeCase(entry.id, c);
  }
  if (entry.category === 'digest') {
    const fixture = JSON.parse(readFileSync(join(root, entry.files[0]), 'utf8'));
    if (fixture.payload) {
      const once = sha256Digest(fixture.payload);
      const twice = sha256Digest(fixture.payload);
      if (once !== twice) {
        console.error(`check-schema digest unstable ${entry.id}`);
        process.exit(1);
      }
      if (fixture.expect && once !== fixture.expect) {
        console.error(`check-schema digest mismatch ${entry.id}: got ${once}`);
        process.exit(1);
      }
      continue;
    }
    for (const c of fixture.cases ?? []) {
      if (c.expectSameAsSelf && c.value) {
        const once = sha256Digest(c.value);
        const twice = sha256Digest(c.value);
        if (once !== twice) {
          console.error(`check-schema digest unstable ${entry.id}`);
          process.exit(1);
        }
      }
    }
  }
}

console.log(`check-schema ok (${index.vectors.length} vectors indexed)`);
