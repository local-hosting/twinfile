#!/usr/bin/env node
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const simulatorRoot = resolve(root, '../simulator');
const simulatorDist = join(simulatorRoot, 'dist/index.js');
if (!statSync(simulatorDist, { throwIfNoEntry: false })?.isFile()) {
  console.error(`run-conformance: missing ${simulatorDist} (build @doppler-group/twinfile-simulator)`);
  process.exit(1);
}

const { createTimeline, resolveTrackFeeds, resolvePhaseStarts } = await import(simulatorDist);

const {
  validateDocumentAtPath,
  validateTwinfileYamlPath,
  mergeObjects,
  sha256Digest,
  layerChainDigest,
  placeImageDigest,
  ContractChecker,
  RefResolver,
  isTwinfileRef,
  queryPath,
  importExternal,
  exportExternal,
  writeImportedFiles,
  loadTwinfile,
  assertCrosswalkPlacement,
} = await import(join(root, 'dist/index.js'));
const { composePlace } = await import('@doppler-group/twinfile-place');

const specRoot = dirname(require.resolve('@doppler-group/twinfile-spec/package.json'));
const index = JSON.parse(readFileSync(join(specRoot, 'conf', 'index.json'), 'utf8'));

const report = [];
let failed = 0;

function loadJson(rel) {
  return JSON.parse(readFileSync(join(specRoot, rel), 'utf8'));
}

function failVector(id, detail) {
  failed += 1;
  report.push({ id, ok: false, detail });
}

function passVector(id, detail = 'ok') {
  report.push({ id, ok: true, detail });
}

function runMergeVector(vector) {
  const data = loadJson(vector.files[0]);
  const cases = data.cases ?? [data];
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i];
    const out = mergeObjects(c.base, c.patch);
    const got = JSON.stringify(out);
    const want = JSON.stringify(c.expect);
    if (got !== want) {
      failVector(vector.id, `merge case ${i} mismatch`);
      return;
    }
  }
  passVector(vector.id, `${cases.length} merge case(s)`);
}

function runDigestVector(vector) {
  const data = loadJson(vector.files[0]);
    if (data.payload) {
      const a = sha256Digest(data.payload);
      const b = sha256Digest(data.payload);
      if (a !== b) {
        failVector(vector.id, 'unicode digest unstable');
        return;
      }
      passVector(vector.id, 'unicode digest');
      return;
    }
  const cases = data.cases ?? [];
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i];
    if (c.expectSameAsSelf) {
      const a = sha256Digest(c.value);
      const b = sha256Digest(c.value);
      if (a !== b) {
        failVector(vector.id, `digest unstable case ${i}`);
        return;
      }
    }
    if (c.expectChainStable && c.chain) {
      const a = layerChainDigest(c.chain);
      const b = layerChainDigest(c.chain);
      if (a !== b) {
        failVector(vector.id, `chain unstable case ${i}`);
        return;
      }
    }
    if (c.expectBundleStable && c.bundle) {
      const a = placeImageDigest(c.bundle);
      const b = placeImageDigest(c.bundle);
      if (a !== b) {
        failVector(vector.id, `Place digest unstable case ${i}`);
        return;
      }
    }
  }
  passVector(vector.id, `${cases.length || 1} digest case(s)`);
}

function runContractVector(vector) {
  const checker = new ContractChecker();
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    if (c.expectPass) {
      const errors = checker.checkExpects(c.place, c.expects, c.planRoles);
      if (errors.length) {
        failVector(vector.id, `${c.id} expected pass`);
        return;
      }
      continue;
    }
    if (c.expectCodes?.includes('E_NO_PLAN')) {
      const err = checker.checkPlanPresent(c.planRoles, c.situationName ?? 'situation');
      if (!err || err.code !== 'E_NO_PLAN') {
        failVector(vector.id, `${c.id} expected E_NO_PLAN`);
        return;
      }
      continue;
    }
    const errors = checker.checkExpects(c.place, c.expects, c.planRoles);
    for (const code of c.expectCodes ?? []) {
      if (!errors.some((e) => e.code === code)) {
        failVector(vector.id, `${c.id} missing ${code}`);
        return;
      }
    }
  }
  passVector(vector.id, `${data.cases.length} contract case(s)`);
}

function runRefsVector(vector) {
  const resolver = new RefResolver();
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    if (c.expectInvalid) {
      if (isTwinfileRef(c.ref)) {
        failVector(vector.id, `expected invalid ref ${c.ref}`);
        return;
      }
      continue;
    }
    const resolved = resolver.resolve(c.ref);
    if (c.expect.name && resolved.name !== c.expect.name) {
      failVector(vector.id, `ref name ${c.ref}`);
      return;
    }
    if (c.expect.tag && resolved.tag !== c.expect.tag) {
      failVector(vector.id, `ref tag ${c.ref}`);
      return;
    }
    if (c.expect.rawPrefix && !resolved.raw.startsWith(c.expect.rawPrefix)) {
      failVector(vector.id, `ref prefix ${c.ref}`);
      return;
    }
  }
  passVector(vector.id, `${data.cases.length} ref case(s)`);
}

function runRunnerVector(vector) {
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    if (c.stdin) {
      for (const key of c.expectKeys ?? []) {
        if (!(key in c.stdin)) {
          failVector(vector.id, `stdin missing ${key}`);
          return;
        }
      }
    }
    if (c.stdoutLine?.type && !(c.expectTypes ?? []).includes(c.stdoutLine.type)) {
      failVector(vector.id, `record type ${c.stdoutLine.type}`);
      return;
    }
  }
  passVector(vector.id, `${data.cases.length} runner case(s)`);
}

function runLayersVector(vector) {
  const data = loadJson(vector.files[0]);
  if (data.cases.length < 8) {
    failVector(vector.id, 'need at least 8 layer cases');
    return;
  }
  passVector(vector.id, `${data.cases.length} layer case(s) indexed`);
}

function sameNumber(actual, expected) {
  if (expected === null) return actual === null;
  return typeof actual === 'number' && Math.abs(actual - expected) < 1e-6;
}

function timeCaseProblems(c) {
  const phaseStarts =
    c.phaseStarts ??
    resolvePhaseStarts({
      clock: c.clock,
      situations: c.situations ?? [],
      resolvedArgs: c.resolvedArgs ?? {},
    });
  const feeds =
    c.feeds ??
    resolveTrackFeeds({
      mergedPlace: c.place,
      tracks: c.place.tracks ?? [],
      placeRoot: '.',
      clock: c.clock,
      seed: c.seed ?? 1,
      phaseStarts,
    });
  const timeline = createTimeline({
    clock: c.clock,
    timezone: c.timezone,
    location: c.location,
    mergedPlace: c.place,
    feeds,
    seed: c.seed ?? 1,
  });
  const problems = [];
  for (const exp of c.expect) {
    const sample = timeline.at(exp.t);
    for (const [view, wants] of [['tracks', exp.tracks], ['known', exp.known]]) {
      for (const [track, want] of Object.entries(wants ?? {})) {
        if (!sameNumber(sample[view][track], want)) problems.push(`t=${exp.t} ${view}.${track}=${sample[view][track]}`);
      }
    }
    if (exp.active && JSON.stringify(sample.active.map((a) => a.id)) !== JSON.stringify(exp.active)) {
      problems.push(`t=${exp.t} active`);
    }
    if (exp.occupancy) {
      const pick = (row) => ({
        schedule: row.schedule,
        ...(row.space !== undefined ? { space: row.space } : {}),
        ...(row.opening !== undefined ? { opening: row.opening } : {}),
        ...(row.route !== undefined ? { route: row.route } : {}),
        ...(row.marker !== undefined ? { marker: row.marker } : {}),
      });
      if (JSON.stringify(sample.occupancy.map(pick)) !== JSON.stringify(exp.occupancy.map(pick))) {
        problems.push(`t=${exp.t} occupancy`);
      }
    }
    if (exp.visit_beats) {
      const got = sample.visit_beats.map((b) => ({ id: b.id, space: b.space, schedule: b.schedule }));
      if (JSON.stringify(got) !== JSON.stringify(exp.visit_beats)) problems.push(`t=${exp.t} visit_beats`);
    }
    if (exp.range) {
      const v = sample.tracks[exp.range.track];
      if (typeof v !== 'number' || v < exp.range.min || v > exp.range.max) problems.push(`t=${exp.t} ${exp.range.track}=${v}`);
    }
  }
  return problems;
}

function runTimeVector(vector) {
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    const problems = timeCaseProblems(c);
    if (problems.length) {
      failVector(vector.id, `${c.id}: ${problems.join('; ')}`);
      return;
    }
  }
  passVector(vector.id, `${data.cases.length} time case(s)`);
}

/** YAML is a JSON superset, so fixtures are written as JSON text. */
function writeJsonTree(dir, files) {
  for (const [rel, doc] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), JSON.stringify(doc));
  }
}

function unitHead(kind, name) {
  return { twinfile: 1, kind, id: name, version: '0.1.0', stability: 'example' };
}

function composeCase(examplesRoot, c, withList) {
  const dir = mkdtempSync(join(examplesRoot, 'place-'));
  const place = {
    name: c.id,
    kind: 'venue',
    timezone: 'Etc/UTC',
    ...(c.archetype === null ? {} : { archetype: c.archetype ?? 'single_level' }),
  };
  const files = { 'place/place.yaml': { place }, ...(c.spaces ? { 'place/spaces.yaml': { spaces: c.spaces } } : {}) };
  const manifest = {
    ...unitHead('place', 'compose-case'),
    ...(c.axes ? { axes: c.axes } : {}),
    ...(withList.length ? { with: withList.map((name) => `twinfile/${name}:0.1.0`) } : {}),
    layers: Object.keys(files),
  };
  writeJsonTree(dir, { 'Twinfile.yaml': manifest, ...files });
  return composePlace(
    { root: dir, twinfilePath: join(dir, 'Twinfile.yaml'), twinfile: manifest },
    { examplesRoot },
  );
}

function rowSet(place) {
  return Object.entries(place)
    .flatMap(([key, value]) => (Array.isArray(value) ? value.map((row) => `${key}/${JSON.stringify(row)}`) : [`${key}=${JSON.stringify(value)}`]))
    .sort();
}

function chainDigest(layers) {
  let parent = null;
  for (const layer of layers) {
    parent = layerChainDigest({ parent, content: sha256Digest(layer.patch), kind: layer.kind, ref: layer.ref });
  }
  return parent;
}

function composeCaseProblem(examplesRoot, c) {
  const got = composeCase(examplesRoot, c, c.with ?? []);
  if (c.expectCodes) {
    if (got.ok) return 'expected failure';
    const missing = c.expectCodes.filter((code) => !got.errors.some((e) => e.code === code));
    return missing.length ? `missing ${missing.join(', ')}` : undefined;
  }
  if (!got.ok) return got.errors.map((e) => `${e.code}: ${e.message}`).join('; ');
  const archetype = got.value.place.place?.archetype;
  if (c.expectArchetype && archetype !== c.expectArchetype) return `archetype ${archetype}, want ${c.expectArchetype}`;
  if (c.sameRowsAs) {
    const other = composeCase(examplesRoot, c, c.sameRowsAs);
    if (!other.ok) return 'reordered compose failed';
    if (JSON.stringify(rowSet(other.value.place)) !== JSON.stringify(rowSet(got.value.place))) return 'rows differ by order';
    if (chainDigest(other.value.layers) === chainDigest(got.value.layers)) return 'chain digest ignores with order';
  }
  return undefined;
}

function runComposeVector(vector) {
  const data = loadJson(vector.files[0]);
  const examplesRoot = mkdtempSync(join(tmpdir(), 'tf-compose-'));
  try {
    for (const [name, mixin] of Object.entries(data.mixins)) {
      writeJsonTree(join(examplesRoot, 'mixins', name), {
        'Twinfile.yaml': { ...unitHead('mixin', name), ...(mixin.manifest ?? mixin.twinfile ?? {}) },
        ...mixin.files,
      });
    }
    const refLines = ['refs:'];
    for (const name of Object.keys(data.mixins)) {
      refLines.push(`  twinfile/${name}:0.1.0: mixins/${name}`);
    }
    writeFileSync(join(examplesRoot, 'twin.local.yaml'), `${refLines.join('\n')}\n`);
    for (const c of data.cases) {
      const problem = composeCaseProblem(examplesRoot, c);
      if (problem) {
        failVector(vector.id, `${c.id}: ${problem}`);
        return;
      }
    }
    passVector(vector.id, `${data.cases.length} compose case(s)`);
  } finally {
    rmSync(examplesRoot, { recursive: true, force: true });
  }
}

function runPathVector(vector) {
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    const blocked = queryPath(c.place, { from: c.blocked.from, to: c.blocked.to });
    if (blocked.mode !== 'path' || blocked.path !== null) {
      failVector(vector.id, `${c.id}: closed opening still has a path`);
      return;
    }
    const openedPlace = structuredClone(c.place);
    openedPlace.openings[0].state = c.openedPlaceDoor;
    const opened = queryPath(openedPlace, { from: c.opened.from, to: c.opened.to });
    if (opened.mode !== 'path' || !opened.path) {
      failVector(vector.id, `${c.id}: open door has no path`);
      return;
    }
    for (const key of ['spaces', 'openings', 'routes', 'length_m']) {
      if (JSON.stringify(opened.path[key]) !== JSON.stringify(c.opened.expect[key])) {
        failVector(vector.id, `${c.id}: opened ${key}`);
        return;
      }
    }
    const stair = queryPath(c.place, { from: c.stair.from, to: c.stair.to });
    if (stair.mode !== 'path' || !stair.path || stair.path.routes.join(',') !== c.stair.expect.routes.join(',')) {
      failVector(vector.id, `${c.id}: expected the stair`);
      return;
    }
    const stepped = queryPath(c.place, { from: c.stepFree.from, to: c.stepFree.to, step_free: true });
    if (stepped.mode !== 'path' || !stepped.path || stepped.path.routes.includes('stair')) {
      failVector(vector.id, `${c.id}: step_free did not refuse the stair`);
      return;
    }
    if (stepped.path.routes.join(',') !== c.stepFree.expect.routes.join(',') || stepped.path.length_m !== c.stepFree.expect.length_m) {
      failVector(vector.id, `${c.id}: step_free path`);
      return;
    }
    const reach = queryPath(c.place, { role: c.reachable.role });
    if (reach.mode !== 'reachable' || reach.spaces.join(',') !== c.reachable.spaces.join(',')) {
      failVector(vector.id, `${c.id}: reachable`);
      return;
    }
  }
  passVector(vector.id, `${data.cases.length} path case(s)`);
}

function valueAt(root, path) {
  let cur = root;
  for (const key of path) {
    if (cur == null) return undefined;
    cur = Array.isArray(cur) ? cur[Number(key)] : cur[key];
  }
  return cur;
}

function runMapVector(vector) {
  const data = loadJson(vector.files[0]);
  for (const c of data.cases) {
    const input =
      c.source === 'gtfs'
        ? {
            stops: readFileSync(join(specRoot, c.stops), 'utf8'),
            shapes: readFileSync(join(specRoot, c.shapes), 'utf8'),
            ...(c.pathways ? { pathways: readFileSync(join(specRoot, c.pathways), 'utf8') } : {}),
          }
        : loadJson(c.file);
    let imported;
    try {
      imported = importExternal(c.source, input);
    } catch (error) {
      failVector(vector.id, `${c.id}: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    try {
      assertCrosswalkPlacement(c.source, c.source === 'sosa' ? { feed: imported.feed } : imported.place);
    } catch (error) {
      failVector(vector.id, `${c.id}: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (c.manifestIncludes && !String(imported.files['Twinfile.yaml'] ?? '').includes(c.manifestIncludes)) {
      failVector(vector.id, `${c.id}: manifest missing ${c.manifestIncludes}`);
      return;
    }
    const holder = c.source === 'sosa' ? imported.feed : imported.place;
    if (valueAt(holder, c.ext.path) !== c.ext.equals) {
      failVector(vector.id, `${c.id}: ext ${c.ext.path.join('.')} is ${JSON.stringify(valueAt(holder, c.ext.path))}`);
      return;
    }
    if (c.exportIncludes) {
      const exported = Object.values(exportExternal(c.source, imported.place, imported.feed)).join('\n');
      if (!exported.includes(c.exportIncludes)) {
        failVector(vector.id, `${c.id}: export dropped ${c.exportIncludes}`);
        return;
      }
    }
    if (c.check) {
      const dir = mkdtempSync(join(tmpdir(), 'tf-map-'));
      try {
        writeImportedFiles(dir, imported.files);
        const loaded = loadTwinfile(dir);
        if (!loaded.ok) {
          failVector(vector.id, `${c.id}: ${loaded.errors.map((e) => e.message).join('; ')}`);
          return;
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  }
  passVector(vector.id, `${data.cases.length} map case(s)`);
}

for (const vector of index.vectors) {
  if (vector.category === 'schema') {
    const file = join(specRoot, vector.files[0]);
    let pass;
    if (vector.schema && vector.schema.includes('/manifest/twinfile.schema.json')) {
      pass = validateTwinfileYamlPath(file).ok;
    } else if (vector.schema) {
      pass = validateDocumentAtPath(file, vector.schema).ok;
    } else {
      pass = false;
    }
    const expectedPass = vector.expect === 'pass';
    const ok = pass === expectedPass;
    if (!ok) failed += 1;
    report.push({
      id: vector.id,
      ok,
      expect: vector.expect,
      detail: pass ? 'validated' : 'rejected',
    });
    continue;
  }

  if (vector.category === 'merge') runMergeVector(vector);
  else if (vector.category === 'digest') runDigestVector(vector);
  else if (vector.category === 'contract') runContractVector(vector);
  else if (vector.category === 'refs') runRefsVector(vector);
  else if (vector.category === 'runner') runRunnerVector(vector);
  else if (vector.category === 'layers') runLayersVector(vector);
  else if (vector.category === 'time') runTimeVector(vector);
  else if (vector.category === 'compose') runComposeVector(vector);
  else if (vector.category === 'path') runPathVector(vector);
  else if (vector.category === 'map') runMapVector(vector);
  else {
    failVector(vector.id, `unknown category ${vector.category}`);
  }
}

writeFileSync(
  join(root, 'conformance-report.json'),
  JSON.stringify(
    {
      implementation: '@doppler-group/twinfile-core',
      version: '0.1.0',
      spec: index.spec,
      failed,
      total: report.length,
      results: report.map((r) => ({ id: r.id, pass: r.ok, detail: r.detail ?? r.expect })),
    },
    null,
    2,
  ),
);

if (failed > 0) {
  console.error(`conformance failed: ${failed} vector(s)`);
  for (const entry of report.filter((e) => !e.ok)) {
    console.error(`  - ${entry.id}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(`conformance ok (${report.length} vectors)`);
