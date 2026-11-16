#!/usr/bin/env node
import '@local-hosting/twinfile-simulator';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { stringify as stringifyYaml } from 'yaml';

import {
  buildLayoutSummary,
  buildTwinfile,
  formatLayoutSummaryText,
  loadTwinfileStrict,
  queryPlace,
  createPlace,
  runExportExternal,
  runImport,
} from '@local-hosting/twinfile-place';
import {
  RefResolver,
  buildPlaceJsonLdFromTwinfile,
  checkProcessorGraph,
  defaultPushRef,
  findTwinHead,
  formatBuildLayerScope,
  formatBuildLayerStepLabel,
  formatTwinfileSummaryMarkdown,
  isTwinfileRef,
  lintDtprDisclosures,
  listDtprDisclosures,
  loadRunUnit,
  loadTwinfile,
  loadUnitRoot,
  packTwinfileOci,
  pullTwinfileFromRegistry,
  pushTwinfileToRegistry,
  queryPath,
  renderTwinfileSummaryAscii,
  resolveExamplesRoot,
  resolveTwinfileAnchor,
  runScenarioRunner,
  exportProjectTwinBundle,
} from '@local-hosting/twinfile-core';
import {
  addAssetsLayerToPlace,
  distRootFromCli,
  formatTwinErrors,
  formatTwinfilePath,
  initUnitFromTemplate,
  resolveRunnerCommand,
  runCommandSend,
  suggestedLayerHints,
  twinfileYamlPaths,
  upgradeTypedHeadFiles,
} from '@local-hosting/twinfile-core/cli';

import {
  PlaceHost,
  addBindToPlace,
  createRunPayload,
  runMcpStdio,
} from '@local-hosting/twinfile-simulator';
import { runTwinTypeBuild } from './build-twin-type.js';
import { runFeedPull } from './feed-pull.js';
import { runFeedSimulate } from './feed-simulate.js';
import { evalRunPreset } from '../eval/index.js';

const argv = process.argv.slice(2);
const command = argv[0];

function usage(): never {
  console.error(`Usage:
  twin check [dir] [--strict] [--profile processors] [--examples-root <path>] [--frozen] [--json]
  twin build [dir] [--out <dir>] [--frozen] [--no-lock] [--json]
  twin pack [dir] [--out <dir>] [--json]
  twin push [dir] [--ref <twinfile/name:tag>] [--registry <host>] [--json]
  twin pull <ref> [--out <dir>] [--registry <host>] [--json]
  twin ref resolve <twinfile/name:semver>
  twin ref validate <string>
  twin lock [dir] [--update]
  twin layers [dir]
  twin layout summary [dir] [--json]
  twin query [dir] [--role <role>] [--from <id>] [--to <id>] [--reachable <role>] [--step-free] [--json]
  twin describe [dir] [--space <id>] [--t <seconds>] [--seed N] [--json]
  twin summary [dir] [--json | --yaml | --markdown]   # alias: twin card
  twin run [scenarioDir] [--seed N]
  twin feed simulate [scenarioDir] --device <id> [--out <file>] [--seed N]
  twin feed pull --protocol <sensorthings|ngsi-ld> --url <endpoint> --device <id> --property <name> --out <file.jsonl>
  twin command send <run.jsonl> --allow-send
  twin verify [scenarioDir] [--frozen]
  twin fmt [path] [--check] [--recursive] [--upgrade=2] [--upgrade=heads]
  twin init place <dir> [--geotype <slug>] [--no-from] [--no-decorate] [--name <unitName>]
  twin add bind <situation> [dir] [--force] [--examples-root <path>]   # alias: add plan
  twin add assets [dir] [--force]
  twin disclose [dir] [--json | --yaml]   # HTML: host UI (e.g. writeDiscloseHtml)
  twin import <imdf|gtfs|brick|bot|sosa|gltf|ifc|indoorgml> <file-or-dir> --out <dir>
  twin import --bridge <source-id|npm:…> <file-or-dir> --out <dir>
  twin export jsonld [dir] [--out <file>] [--json]
  twin export <imdf|gtfs|brick|bot|sosa|indoorgml> [dir] --out <dir>
  twin project export [--format json|yaml] [--out <file>]
  twin eval <scenarioDir> [--runs <dir>]
  twin migrate axm|jsm <path>   # persona plane import (stub)
  twin serve [dir] [--stdio] [--allow-runs]`);
  process.exit(2);
}

function parseCheckArgs(args: string[]): {
  dir: string;
  json: boolean;
  strict: boolean;
  frozen: boolean;
  profileProcessors: boolean;
  examplesRoot?: string;
} {
  let dir = '.';
  let json = false;
  let strict = false;
  let frozen = false;
  let profileProcessors = false;
  let examplesRoot: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--strict') strict = true;
    else if (arg === '--frozen') frozen = true;
    else if (arg === '--profile') {
      const name = args[i + 1];
      i += 1;
      if (name === 'processors' || name === 'patch') profileProcessors = true;
      else if (name) {
        console.error(`unknown check profile: ${name}`);
        process.exit(2);
      }
    } else if (arg === '--examples-root') {
      examplesRoot = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('-')) dir = arg;
  }
  return { dir, json, strict, frozen, profileProcessors, examplesRoot };
}

function parseBuildArgs(args: string[]): {
  dir: string;
  json: boolean;
  frozen: boolean;
  writeLock: boolean;
  outDir?: string;
} {
  let dir = '.';
  let json = false;
  let frozen = false;
  let writeLock = true;
  let outDir: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--frozen') frozen = true;
    else if (arg === '--no-lock') writeLock = false;
    else if (arg === '--out') {
      outDir = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('-')) dir = arg;
  }
  return { dir, json, frozen, writeLock, outDir };
}

function parsePushArgs(args: string[]): {
  dir: string;
  json: boolean;
  ref?: string;
  registry?: string;
} {
  let dir = '.';
  let json = false;
  let ref: string | undefined;
  let registry: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--ref') {
      ref = args[i + 1];
      i += 1;
    } else if (arg === '--registry') {
      registry = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('-')) dir = arg;
  }
  return { dir, json, ref, registry };
}

function parsePullArgs(args: string[]): {
  ref: string;
  outDir: string;
  json: boolean;
  registry?: string;
} {
  let ref = '';
  let outDir = './pulled-unit';
  let json = false;
  let registry: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--out') {
      outDir = args[i + 1] ?? outDir;
      i += 1;
    } else if (arg === '--registry') {
      registry = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('-') && !ref) ref = arg;
  }
  return { ref, outDir, json, registry };
}

async function runCheck(): Promise<number> {
  const { dir, json, strict, frozen, profileProcessors, examplesRoot: explicitRoot } = parseCheckArgs(
    argv.slice(1),
  );
  const unitDir = resolve(dir);
  const examplesRoot = explicitRoot ?? (strict || profileProcessors ? resolveExamplesRoot(unitDir) : undefined);

  if (strict && !examplesRoot) {
    console.error('twin check --strict requires --examples-root or TF_TWINFILE_ROOT');
    process.exit(2);
  }

  const loadResult =
    strict && examplesRoot ? loadTwinfileStrict(unitDir, { examplesRoot }) : loadUnitRoot(unitDir);

  if (!loadResult.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: loadResult.errors }, null, 2)]
      : formatTwinErrors(unitDir, loadResult.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  let processorSummary: { processorCount: number; outletCount: number } | undefined;
  if (profileProcessors) {
    if (!examplesRoot) {
      console.error('twin check --profile processors requires --examples-root or TF_TWINFILE_ROOT');
      process.exit(2);
    }
    const built = await buildTwinfile(unitDir, {
      examplesRoot,
            writeLock: false,
          });
    if (!built.ok) {
      const lines = json
        ? [JSON.stringify({ ok: false, errors: built.errors }, null, 2)]
        : formatTwinErrors(unitDir, built.errors);
      for (const line of lines) console.error(line);
      return 1;
    }
    const graphResult = checkProcessorGraph(loadResult.value.twinfile, built.value.data);
    if (!graphResult.ok) {
      const lines = json
        ? [JSON.stringify({ ok: false, errors: graphResult.errors }, null, 2)]
        : formatTwinErrors(unitDir, graphResult.errors);
      for (const line of lines) console.error(line);
      return 1;
    }
    processorSummary = graphResult.value;
  }

  if (frozen) {
    const build = await buildTwinfile(unitDir, { frozen: true, writeLock: false });
    if (!build.ok) {
      const lines = json
        ? [JSON.stringify({ ok: false, errors: build.errors }, null, 2)]
        : formatTwinErrors(unitDir, build.errors);
      for (const line of lines) console.error(line);
      return 1;
    }
  }

  const extra =
    `${'strictBindings' in loadResult.value ? ` strictBindings=${String(loadResult.value.strictBindings)}` : ''}${profileProcessors ? ' profile=processors' : ''}`;
  const frozenNote = frozen ? ' frozen=ok' : '';
  const lines = json
    ? [
        JSON.stringify(
          {
            ok: true,
            root: loadResult.value.root,
            kind: loadResult.value.twinfile.kind,
            ...(frozen ? { frozen: true } : {}),
            ...('strictBindings' in loadResult.value ? { strictBindings: loadResult.value.strictBindings } : {}),
            ...(processorSummary ? { processors: processorSummary } : {}),
          },
          null,
          2,
        ),
      ]
    : [`ok ${loadResult.value.root} (${String(loadResult.value.twinfile.kind)})${extra}${frozenNote}`];
  for (const line of lines) console.log(line);
  return 0;
}

async function runBuild(): Promise<number> {
  const { dir, json, frozen, writeLock } = parseBuildArgs(argv.slice(1));
  const unitDir = resolve(dir);
  const head = findTwinHead(unitDir);
  if (head && head.kind !== 'place') return runTwinTypeBuild(unitDir, head.kind, json);

  const result = await buildTwinfile(unitDir, {
    frozen,
    writeLock,
  });

  if (!result.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: result.errors }, null, 2)]
      : formatTwinErrors(unitDir, result.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const lines = json
    ? [JSON.stringify({ ok: true, digest: result.value.digest, refKey: result.value.refKey }, null, 2)]
    : [
        ...result.value.layers.map(
          (layer, i) =>
            `[${i + 1}/${result.value.layers.length}] ${layer.kind.toUpperCase()} ${layer.ref} ${layer.chain.slice(0, 19)}…`,
        ),
        `contract: ok`,
        `place  ${result.value.digest}`,
      ];
  for (const line of lines) console.log(line);
  return 0;
}

async function runPack(): Promise<number> {
  const { dir, json, outDir } = parseBuildArgs(argv.slice(1));
  const unitDir = resolve(dir);
  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: loaded.errors }, null, 2)]
      : formatTwinErrors(unitDir, loaded.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const ociDir = outDir
    ? resolve(outDir.startsWith('/') || outDir.startsWith('~') ? outDir : join(unitDir, outDir))
    : mkdtempSync(join(tmpdir(), 'twinfile-pack-'));
  const packed = await packTwinfileOci(unitDir, loaded.value.twinfile, ociDir);
  if (!packed.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: packed.errors }, null, 2)]
      : formatTwinErrors(unitDir, packed.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const lines = json
    ? [JSON.stringify({ ok: true, treeDigest: packed.value.treeDigest, ociDir }, null, 2)]
    : [`ok ${ociDir} tree=${packed.value.treeDigest}`];
  for (const line of lines) console.log(line);
  return 0;
}

async function runPush(): Promise<number> {
  const { dir, json, ref: explicitRef, registry } = parsePushArgs(argv.slice(1));
  const unitDir = resolve(dir);
  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: loaded.errors }, null, 2)]
      : formatTwinErrors(unitDir, loaded.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const ref = explicitRef ?? defaultPushRef(loaded.value.twinfile);
  const result = await pushTwinfileToRegistry(unitDir, { ref, registry });
  if (!result.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: result.errors }, null, 2)]
      : formatTwinErrors(unitDir, result.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const lines = json
    ? [JSON.stringify({ ok: true, ...result.value }, null, 2)]
    : [
        `ok pushed ${result.value.registry}/${result.value.repository}:${result.value.tag} manifest=${result.value.manifestDigest}`,
      ];
  for (const line of lines) console.log(line);
  return 0;
}

async function runPull(): Promise<number> {
  const { ref, outDir, json, registry } = parsePullArgs(argv.slice(1));
  if (!ref) {
    console.error('twin pull requires a ref');
    return 2;
  }

  const result = await pullTwinfileFromRegistry({
    ref,
    outDir: resolve(outDir),
    registry,
  });
  if (!result.ok) {
    const lines = json
      ? [JSON.stringify({ ok: false, errors: result.errors }, null, 2)]
      : formatTwinErrors(ref, result.errors);
    for (const line of lines) console.error(line);
    return 1;
  }

  const lines = json
    ? [JSON.stringify({ ok: true, ...result.value }, null, 2)]
    : [`ok ${result.value.outDir} tree=${result.value.treeDigest}`];
  for (const line of lines) console.log(line);
  return 0;
}

async function runLock(): Promise<number> {
  const dir = resolve(argv[1] ?? '.');
  const result = await buildTwinfile(dir, { writeLock: true });
  if (!result.ok) {
    console.error(formatTwinErrors(dir, result.errors).join('\n'));
    return 1;
  }
  console.log(`ok lock ${join(dir, 'Twinfile.lock')}`);
  return 0;
}

async function runLayers(): Promise<number> {
  const dir = resolve(argv[1] ?? '.');
  const result = await buildTwinfile(dir, { writeLock: false });
  if (!result.ok) {
    console.error(formatTwinErrors(dir, result.errors).join('\n'));
    return 1;
  }
  for (const layer of result.value.layers) {
    const scope = formatBuildLayerScope(layer.ref);
    const step = formatBuildLayerStepLabel(layer.ref);
    console.log(`${scope}\t${layer.kind}\t${step}\t${layer.ref}\t${layer.chain}`);
  }
  return 0;
}

async function runQuery(): Promise<number> {
  const positional = argv.slice(1).filter((arg, index, all) => !arg.startsWith('--') && !all[index - 1]?.startsWith('--'));
  const dir = resolve(positional[0] ?? '.');
  let role: string | undefined;
  let from: string | undefined;
  let to: string | undefined;
  let reachable: string | undefined;
  let stepFree = false;
  let json = false;
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--role') role = argv[i + 1];
    else if (arg === '--from') from = argv[i + 1];
    else if (arg === '--to') to = argv[i + 1];
    else if (arg === '--reachable') reachable = argv[i + 1];
    else if (arg === '--step-free') stepFree = true;
    else if (arg === '--json') json = true;
  }
  const built = await buildTwinfile(dir, { writeLock: false });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }
  const digest = built.value.digest;
  if (from || to || reachable) {
    try {
      const result = queryPath(built.value.data, {
        from,
        to,
        role: reachable,
        step_free: stepFree,
      });
      if (json) console.log(JSON.stringify({ digest, ...result }, null, 2));
      else if (result.mode === 'reachable') console.log(result.spaces.join('\n'));
      else if (!result.path) console.log('unreachable');
      else console.log(`${result.path.spaces.join(' ')} ${result.path.length_m}`);
      return 0;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
  const rows = queryPlace(built.value.data, { collection: 'spaces', role, limit: 20 });
  console.log(json ? JSON.stringify({ digest, rows }, null, 2) : rows.map((row) => row.id).join('\n'));
  return 0;
}

async function runRunScenario(scenarioDir: string): Promise<number> {
  const dir = resolve(scenarioDir);
  const examplesRoot = resolveExamplesRoot(dir) ?? resolveExamplesRoot(process.cwd());
  if (!examplesRoot) {
    console.error('twin run requires TF_TWINFILE_ROOT');
    return 2;
  }
  const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }
  const loaded = loadRunUnit(dir);
  if (!loaded.ok) {
    console.error(formatTwinErrors(dir, loaded.errors).join('\n'));
    return 1;
  }
  const runner = String((loaded.value.twinfile.use as { runner?: string } | undefined)?.runner ?? '');
  const distRoot = distRootFromCli();
  const anchor = resolveTwinfileAnchor(dir, {
    ...loaded.value.twinfile,
    twinfilePath: loaded.value.twinfilePath,
  });
  const resolvedArgs =
    (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
  const runResult = await runScenarioRunner({
    runnerCommand: resolveRunnerCommand(runner, distRoot),
    payload: createRunPayload({
      built: built.value,
      layers: built.value.layers,
      twinfile: loaded.value.twinfile,
      runName: String(built.value.loaded.twinfile.id),
      args: resolvedArgs,
      placeRoot: anchor,
      seed: 1,
    }),
    runsDir: join(dir, 'runs'),
    runName: String(built.value.loaded.twinfile.id),
  });
  console.log(`ok run ${runResult.recordsPath}`);
  return 0;
}

async function runRun(): Promise<number> {
  return runRunScenario(argv[1] ?? '.');
}

async function runVerify(): Promise<number> {
  const dir = resolve(argv[1] ?? '.');
  const frozen = argv.includes('--frozen');
  const examplesRoot = resolveExamplesRoot(dir) ?? resolveExamplesRoot(process.cwd());
  if (!examplesRoot) {
    console.error('twin verify requires TF_TWINFILE_ROOT');
    return 2;
  }
  const built = await buildTwinfile(dir, {
    examplesRoot,
    frozen,
        writeLock: false,
      });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }
  const expectedDir = join(dir, 'expected');
  const digestPath = join(expectedDir, 'digest.txt');
  if (existsSync(digestPath)) {
    const expectedDigest = readFileSync(digestPath, 'utf8').trim();
    if (expectedDigest !== built.value.digest) {
      console.error(`verify: digest mismatch expected ${expectedDigest} got ${built.value.digest}`);
      return 1;
    }
  }
  await runRunScenario(dir);
  const metricsPath = join(expectedDir, 'metrics.json');
  if (existsSync(metricsPath)) {
    const expected = JSON.parse(readFileSync(metricsPath, 'utf8')) as Record<string, number>;
    const actual = JSON.parse(readFileSync(join(dir, 'runs', `${built.value.loaded.twinfile.id}.metrics.json`), 'utf8')) as Record<
      string,
      number
    >;
    for (const [key, val] of Object.entries(expected)) {
      if (actual[key] !== val) {
        console.error(`verify: metric ${key} expected ${val} got ${actual[key]}`);
        return 1;
      }
    }
  }
  console.log('ok verify');
  return 0;
}

async function runAdd(): Promise<number> {
  const sub = argv[1];
  if (sub === 'bind' || sub === 'plan') {
    let situation = '';
    let dir = '.';
    let force = false;
    let examplesRoot: string | undefined;
    for (let i = 2; i < argv.length; i += 1) {
      const arg = argv[i]!;
      if (arg === '--force') force = true;
      else if (arg === '--examples-root') {
        examplesRoot = argv[i + 1];
        i += 1;
      } else if (!arg.startsWith('-') && !situation) {
        situation = arg;
      } else if (!arg.startsWith('-')) {
        dir = arg;
      }
    }
    if (!situation) {
      console.error('twin add bind requires a situation name (e.g. severe-weather)');
      return 2;
    }
    const unitDir = resolve(dir);
    try {
      const result = await addBindToPlace(unitDir, situation, { force, examplesRoot });
      for (const warning of result.warnings) {
        console.error(`warn: ${warning}`);
      }
      console.log(`ok add bind ${result.location} (${situation})`);
      return result.warnings.length > 0 ? 0 : 0;
    } catch (error) {
      console.error(String(error));
      return 1;
    }
  }
  if (sub === 'assets') {
    let dir = '.';
    let force = false;
    for (let i = 2; i < argv.length; i += 1) {
      const arg = argv[i]!;
      if (arg === '--force') force = true;
      else if (!arg.startsWith('-')) dir = arg;
    }
    try {
      const result = addAssetsLayerToPlace(resolve(dir), { force });
      console.log(`ok add assets ${result.location}`);
      return 0;
    } catch (error) {
      console.error(String(error));
      return 1;
    }
  }
  console.error('twin add supports: plan <situation> [dir] | assets [dir]');
  return 2;
}

function runFmt(args: string[]): number {
  const check = args.includes('--check');
  const recursive = args.includes('--recursive');
  const upgradeArg = args.find((a) => a.startsWith('--upgrade'));
  if (upgradeArg && upgradeArg !== '--upgrade=2' && upgradeArg !== '--upgrade=heads') {
    console.error('twin fmt: use --upgrade=2 or --upgrade=heads');
    return 2;
  }
  const upgrade = upgradeArg === '--upgrade=2' ? 2 : undefined;
  const upgradeHeads = upgradeArg === '--upgrade=heads';
  const targetArg = args.find((a) => !a.startsWith('-'));
  const target = resolve(targetArg ?? '.');
  if (upgradeHeads) {
    return upgradeTypedHeadFiles(target, { check, recursive });
  }
  const paths = twinfileYamlPaths(target, recursive);
  if (paths.length === 0) {
    console.error(`twin fmt: no twinfile manifests under ${target}${recursive ? '' : ' (use --recursive?)'}`);
    return 2;
  }
  let failed = 0;
  for (const twinfilePath of paths) {
    const code = formatTwinfilePath(twinfilePath, { check, upgrade });
    if (code === 2) return 2;
    if (code !== 0) {
      console.error(`twin fmt --check: needs formatting: ${twinfilePath}`);
      failed += 1;
      continue;
    }
    if (!check) {
      console.log(`fmt ${twinfilePath}`);
    }
  }
  if (check && failed === 0) {
    console.log(`ok ${paths.length} manifest(s)`);
    return 0;
  }
  return failed > 0 ? 1 : 0;
}

async function runInit(): Promise<number> {
  const kind = argv[1];
  if (kind !== 'place') {
    console.error('twin init currently supports: place <dir> [--geotype <slug>] ...');
    return 2;
  }

  let target = resolve('.');
  let geotype: string | undefined;
  let unitName: string | undefined;
  let useFrom = true;
  let decorate = true;

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--geotype') {
      geotype = argv[i + 1];
      i += 1;
    } else if (arg === '--name') {
      unitName = argv[i + 1];
      i += 1;
    } else if (arg === '--no-from') {
      useFrom = false;
    } else if (arg === '--no-decorate') {
      decorate = false;
    } else if (!arg.startsWith('-')) {
      target = resolve(arg);
    }
  }

  try {
    if (geotype) {
      const created = createPlace(target, { geotype, unitName, useFrom, decorate });
      for (const mixin of created.mixins) console.log(`ok copy ${mixin}`);
      for (const binding of created.bindings) console.log(`ok bind ${binding}`);
      if (created.suggestedLayers.length > 0) {
        console.log(
          `next: twin add ${created.suggestedLayers.join(' | ')} or append ${created.suggestedLayers.map((kind) => `${kind}:`).join(', ')} steps`,
        );
        for (const hint of suggestedLayerHints(created.suggestedLayers)) {
          console.log(`  ${hint}`);
        }
      }
      if (created.suggestBuildingImport) {
        console.log('next: see parts/README.md to add buildings (copy: ./parts/…)');
      }
      if (created.decorateNote) console.log(`skip decorate: ${created.decorateNote}`);
    } else {
      if (argv[2] && !argv[2].startsWith('-')) {
        target = resolve(argv[2]);
      }
      const templatesRoot = join(distRootFromCli(), '../cli/templates');
      initUnitFromTemplate(target, 'place', templatesRoot);
    }
  } catch (error) {
    console.error(String(error));
    return 1;
  }
  console.log(`ok init ${target}`);
  return 0;
}

async function runDisclose(): Promise<number> {
  const dir = resolve(argv[1] ?? '.');
  if (argv.includes('--html')) {
    console.error('twin disclose: HTML is host-rendered (writeDiscloseHtml); use --json or --yaml');
    return 2;
  }
  const json = argv.includes('--json');
  const yaml = argv.includes('--yaml');
  const examplesRoot = resolveExamplesRoot(dir) ?? resolveExamplesRoot(process.cwd());
  const built = await buildTwinfile(dir, {
    examplesRoot,
        writeLock: false,
      });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }
  const issues = lintDtprDisclosures(built.value.data, { published: true });
  for (const issue of issues) {
    console.error(`${issue.code}: ${issue.message}`);
  }
  const rows = listDtprDisclosures(built.value.data);
  if (json) console.log(JSON.stringify({ rows, issues }, null, 2));
  else if (yaml) console.log(stringifyYaml({ rows, issues }));
  else console.log(`ok disclose (${rows.length} row(s), ${issues.length} lint issue(s))`);
  return issues.length > 0 ? 1 : 0;
}

function runEval(args: string[]): number {
  const dirArg = args.find((a) => !a.startsWith('-'));
  if (!dirArg) {
    console.error('twin eval: scenario directory required');
    return 2;
  }
  let runsDir: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--runs') runsDir = resolve(args[i + 1] ?? '');
  }
  const result = evalRunPreset(resolve(dirArg), runsDir);
  for (const line of result.messages) console.log(line);
  console.log(result.pass ? 'ok eval' : 'eval failed');
  return result.pass ? 0 : 1;
}

function runMigrate(args: string[]): number {
  const plane = args[0];
  const path = resolve(args[1] ?? '.');
  if (plane !== 'axm' && plane !== 'jsm') {
    console.error('twin migrate: use axm or jsm');
    return 2;
  }
  console.log(
    `migrate ${plane}: import from ${path} — twins live under place/, character/, story/; legacy AXM in _archive/axm-userkit`,
  );
  return 0;
}

function runProjectExport(): number {
  let format: 'json' | 'yaml' = 'json';
  let outPath: string | undefined;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--format') {
      const next = argv[i + 1];
      if (next === 'yaml' || next === 'json') format = next;
      i += 1;
    } else if (arg === '--out') {
      outPath = resolve(argv[i + 1] ?? '');
      i += 1;
    }
  }
  const bundle = exportProjectTwinBundle();
  const text = format === 'yaml' ? stringifyYaml(bundle) : JSON.stringify(bundle, null, 2);
  if (outPath) {
    writeFileSync(outPath, text, 'utf8');
    console.log(`ok project export → ${outPath}`);
  } else {
    console.log(text);
  }
  return 0;
}

async function runExportJsonld(): Promise<number> {
  let unitDir = resolve('.');
  let outPath: string | undefined;
  let compact = false;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') compact = true;
    else if (arg === '--out') {
      outPath = resolve(argv[i + 1] ?? '');
      i += 1;
    } else if (!arg.startsWith('-')) unitDir = resolve(arg);
  }

  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    console.error(formatTwinErrors(unitDir, loaded.errors).join('\n'));
    return 1;
  }

  const doc = buildPlaceJsonLdFromTwinfile(loaded.value);
  if (!doc) {
    console.error('export jsonld: place unit needs geotype.primary (known @local-hosting/geotypes slug)');
    return 1;
  }

  const text = `${JSON.stringify(doc, null, compact ? 0 : 2)}\n`;
  if (outPath) {
    writeFileSync(outPath, text, 'utf8');
    console.log(`ok export jsonld ${outPath}`);
  } else {
    process.stdout.write(text);
  }
  return 0;
}

async function runLayoutSummary(): Promise<number> {
  const sub = argv[1];
  if (sub !== 'summary') {
    console.error('twin layout currently supports: summary [dir] [--json]');
    return 2;
  }
  let dir = '.';
  let json = false;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--json') json = true;
    else if (!argv[i]!.startsWith('-')) dir = argv[i]!;
  }
  const unitDir = resolve(dir);
  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    console.error(formatTwinErrors(unitDir, loaded.errors).join('\n'));
    return 1;
  }
  if (loaded.value.twinfile.kind !== 'place') {
    console.error('twin layout summary requires a place Twinfile');
    return 2;
  }
  const summary = buildLayoutSummary(loaded.value);
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    process.stdout.write(formatLayoutSummaryText(summary));
  }
  return 0;
}

type CardOutputFormat = 'ascii' | 'json' | 'yaml' | 'markdown';

async function runSummary(): Promise<number> {
  let dir = '.';
  let format: CardOutputFormat = 'ascii';
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === '--json') format = 'json';
    else if (arg === '--yaml') format = 'yaml';
    else if (arg === '--markdown') format = 'markdown';
    else if (arg === '--html' || arg === '--html-doc') {
      console.error('twin summary: HTML is host-rendered (renderTwinfileSummaryHtml); use --json, --yaml, or --markdown');
      return 2;
    } else if (!arg.startsWith('-')) dir = arg;
  }
  const unitDir = resolve(dir);
  const opened = await PlaceHost.load(unitDir);
  if (!opened.ok) {
    console.error(formatTwinErrors(unitDir, opened.errors).join('\n'));
    return 1;
  }
  const host = opened.value;
  console.log(formatSummaryOutput(host.summary(), format));
  return 0;
}

function formatSummaryOutput(summary: import('@local-hosting/twinfile-core').TwinfileSummaryV1, format: CardOutputFormat): string {
  switch (format) {
    case 'markdown':
      return formatTwinfileSummaryMarkdown(summary);
    case 'json':
      return JSON.stringify(
        { digest: summary.digest, summary, card: summary, ascii: renderTwinfileSummaryAscii(summary) },
        null,
        2,
      );
    case 'yaml':
      return stringifyYaml({ digest: summary.digest, summary });
    case 'ascii':
      return `${renderTwinfileSummaryAscii(summary)}\n\n---\n\`twin summary --json\` · \`--yaml\` · \`--markdown\``;
    default: {
      const unhandled: never = format;
      throw new Error(`unknown summary format: ${String(unhandled)}`);
    }
  }
}

async function runDescribe(): Promise<number> {
  let dir = '.';
  let json = false;
  let spaceId: string | undefined;
  let tParam: number | undefined;
  let seed = 1;
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') json = true;
    else if (arg === '--space') spaceId = argv[++i];
    else if (arg === '--t') tParam = Number(argv[++i]);
    else if (arg === '--seed') seed = Number(argv[++i]);
    else if (!arg!.startsWith('-')) dir = arg!;
  }
  const unitDir = resolve(dir);
  const examplesRoot = resolveExamplesRoot(unitDir) ?? resolveExamplesRoot(process.cwd());
  if (!examplesRoot) {
    console.error('twin describe requires TF_TWINFILE_ROOT');
    return 2;
  }
  const opened = await PlaceHost.load(unitDir, { examplesRoot, seed });
  if (!opened.ok) {
    console.error(formatTwinErrors(unitDir, opened.errors).join('\n'));
    return 1;
  }
  try {
    const narrative = opened.value.narrative({
      spaceId,
      ...(tParam !== undefined ? { t: tParam } : {}),
      seed,
    });
    if (json) {
      console.log(JSON.stringify(narrative, null, 2));
    } else {
      console.log(narrative.markdown);
    }
    return 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

async function main(): Promise<void> {
  if (command === 'check') {
    process.exit(await runCheck());
  }
  if (command === 'build') {
    process.exit(await runBuild());
  }
  if (command === 'pack') {
    process.exit(await runPack());
  }
  if (command === 'push') {
    process.exit(await runPush());
  }
  if (command === 'pull') {
    process.exit(await runPull());
  }
  if (command === 'lock') {
    process.exit(await runLock());
  }
  if (command === 'layers') {
    process.exit(await runLayers());
  }
  if (command === 'layout') {
    process.exit(await runLayoutSummary());
  }
  if (command === 'query') {
    process.exit(await runQuery());
  }
  if (command === 'summary' || command === 'card') {
    process.exit(await runSummary());
  }
  if (command === 'describe') {
    process.exit(await runDescribe());
  }
  if (command === 'feed') {
    if (argv[1] === 'simulate') {
      process.exit(await runFeedSimulate(argv.slice(2)));
    }
    if (argv[1] === 'pull') {
      process.exit(await runFeedPull(argv.slice(2)));
    }
    usage();
  }
  if (command === 'command') {
    if (argv[1] === 'send') {
      process.exit(runCommandSend(argv.slice(2)));
    }
    usage();
  }
  if (command === 'run') {
    process.exit(await runRun());
  }
  if (command === 'verify') {
    process.exit(await runVerify());
  }
  if (command === 'fmt') {
    process.exit(runFmt(argv.slice(1)));
  }
  if (command === 'init') {
    process.exit(await runInit());
  }
  if (command === 'add') {
    process.exit(await runAdd());
  }
  if (command === 'view') {
    console.error(
      'twin view removed from open stack — use twin summary [dir], twin describe [dir] [--t seconds], twin layout summary [dir], or twin serve [dir] --stdio (MCP)',
    );
    process.exit(1);
  }
  if (command === 'disclose') {
    process.exit(await runDisclose());
  }
  if (command === 'import') {
    process.exit(await runImport(argv.slice(1)));
  }
  if (command === 'eval') {
    process.exit(runEval(argv.slice(1)));
  }
  if (command === 'migrate') {
    process.exit(runMigrate(argv.slice(1)));
  }
  if (command === 'project') {
    if (argv[1] === 'export') {
      process.exit(runProjectExport());
    }
    usage();
  }
  if (command === 'export') {
    if (argv[1] === 'jsonld') {
      process.exit(await runExportJsonld());
    }
    if (argv[1] === 'imdf' || argv[1] === 'gtfs' || argv[1] === 'brick' || argv[1] === 'bot' || argv[1] === 'sosa') {
      process.exit(await runExportExternal(argv.slice(1)));
    }
    usage();
  }
  if (command === 'serve') {
    const dir = resolve(argv[1] ?? '.');
    if (!argv.includes('--stdio')) {
      console.error('twin serve requires --stdio (MCP JSON-RPC on stdin/stdout)');
      process.exit(2);
    }
    runMcpStdio(dir, { allowRuns: argv.includes('--allow-runs') });
    return;
  }

  if (command !== 'ref') {
    usage();
  }

  const sub = argv[1];
  const arg = argv[2];
  if (!sub || !arg) {
    usage();
  }

  const resolver = new RefResolver();

  switch (sub) {
    case 'resolve': {
      const resolved = resolver.resolve(arg);
      console.log(JSON.stringify(resolved, null, 2));
      break;
    }
    case 'validate': {
      const valid = isTwinfileRef(arg);
      console.log(valid ? 'ok' : 'invalid');
      process.exit(valid ? 0 : 1);
    }
    default:
      usage();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
