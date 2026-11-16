import { join, resolve } from 'node:path';

import {
  composePlaceLayers,
  findSituationBindingForTarget,
  loadSituationBindingDocuments,
  situationBindingLayer,
  readManifestLayers,
} from './compose-helpers.js';
import { catalogResolveOptions } from '@doppler-group/twinfile-core';
import type { ComposedBuildLayer } from './twinfile-builder.js';
import type { ExpectsRole } from '@doppler-group/twinfile-core';
import type { LoadedTwinfile } from '@doppler-group/twinfile-core';
import {
  loadTwinfileAtPath,
  resolveRelativeTwinfilePath,
  resolveTwinfileByRef,
  type TwinfileResolveOptions,
} from '@doppler-group/twinfile-core';
import type { Result } from '@doppler-group/twinfile-core';
import { err, ok } from '@doppler-group/twinfile-core';
import { resolveTimeArg, type SceneSchedule } from '@doppler-group/twinfile-core';
import { readYamlDocument } from '@doppler-group/twinfile-core';
import { twinfileLayerPaths, manifestScenarioComposeRefs } from '@doppler-group/twinfile-core';
import { isPatchesTwinfile } from '@doppler-group/twinfile-core';
import { listTwinfileInstructions } from '@doppler-group/twinfile-core';
import { parseTwinfileRef } from '@doppler-group/twinfile-core';

export type ComposeScenarioResult = {
  layers: ComposedBuildLayer[];
  place: LoadedTwinfile;
  events: Record<string, unknown>[];
  situationBindingDocs: Record<string, unknown>;
  contracts: Array<{
    unitName: string;
    expects: Record<string, ExpectsRole>;
    planRoles?: Record<string, string[]>;
  }>;
  resolvedArgs: Record<string, unknown>;
};

function bindingLayerRef(rel: string): string {
  if (rel.startsWith('bind/') || rel.startsWith('plan/')) return rel.startsWith('plan/') ? `bind/${rel.slice(5)}` : rel;
  const base = rel.replace(/^plans\//, '').replace(/\.ya?ml$/, '');
  return `bind/${base}`;
}

function asExpects(twinfile: Record<string, unknown>): Record<string, ExpectsRole> {
  const expects = twinfile.expects;
  if (!expects || typeof expects !== 'object' || Array.isArray(expects)) return {};
  const out: Record<string, ExpectsRole> = {};
  for (const [name, spec] of Object.entries(expects as Record<string, unknown>)) {
    if (spec && typeof spec === 'object' && !Array.isArray(spec)) {
      const row = spec as Record<string, unknown>;
      if (typeof row.kind === 'string' && typeof row.min === 'number') {
        out[name] = { kind: row.kind, min: row.min };
      }
    }
  }
  return out;
}

function getSceneSchedule(scenario: LoadedTwinfile): SceneSchedule {
  const raw = scenario.twinfile.schedule;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as SceneSchedule) : {};
}

function resolveScenarioArgs(scenario: LoadedTwinfile): Record<string, unknown> {
  const args = scenario.twinfile.args;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {};
  const schedule = getSceneSchedule(scenario);
  return Object.fromEntries(
    Object.entries(args as Record<string, unknown>).map(([key, value]) => [key, resolveTimeArg(value, schedule)]),
  );
}

export function resolveScenarioPlace(
  scenario: LoadedTwinfile,
  options?: TwinfileResolveOptions,
): Result<LoadedTwinfile> {
  const from = scenario.twinfile.from;
  if (typeof from !== 'string') {
    return err([
      { code: 'E_BUILD', message: 'Scenario missing from', file: scenario.twinfilePath },
    ]);
  }

  if (from.includes('twinfile/') && options?.examplesRoot) {
    const byRef = resolveTwinfileByRef(from, { ...options, placeRoot: scenario.root });
    if (byRef.ok && byRef.value.loaded.twinfile.kind === 'place') {
      return ok(byRef.value.loaded);
    }
  }

  const directPath = resolveRelativeTwinfilePath(from, scenario.root);
  const direct = loadTwinfileAtPath(directPath);
  if (direct.ok && direct.value.twinfile.kind === 'place') {
    return direct;
  }

  let dir = scenario.root;
  for (let depth = 0; depth < 8; depth += 1) {
    dir = resolve(dir, '..');
    const candidate = loadTwinfileAtPath(dir);
    if (candidate.ok && candidate.value.twinfile.kind === 'place') {
      return candidate;
    }
  }

  return err([
    {
      code: 'E_BUILD',
      message: `Could not resolve place from scenario from="${from}"`,
      file: scenario.twinfilePath,
    },
  ]);
}

export function composeScenarioLayers(
  scenario: LoadedTwinfile,
  options: TwinfileResolveOptions,
): Result<ComposeScenarioResult> {
  const placeLoad = resolveScenarioPlace(scenario, options);
  if (!placeLoad.ok) return placeLoad;
  const place = placeLoad.value;

  const composeRefs = manifestScenarioComposeRefs(scenario.twinfile);
  if (composeRefs.length === 0) {
    return err([
      {
        code: 'E_BUILD',
        message: 'Scenario missing compose refs (include: or twinfile 2 steps copy)',
        file: scenario.twinfilePath,
      },
    ]);
  }

  const placeInherit = catalogResolveOptions(options.examplesRoot);
  const placeLayers = composePlaceLayers(place, placeInherit);
  if (!placeLayers.ok) return placeLayers;
  const layers: ComposedBuildLayer[] = [...placeLayers.value];
  const events: Record<string, unknown>[] = [];
  const contracts: ComposeScenarioResult['contracts'] = [];
  const resolveOpts: TwinfileResolveOptions = { ...options, placeRoot: place.root };

  for (const ref of composeRefs) {
    if (typeof ref !== 'string') continue;
    const resolved = resolveTwinfileByRef(ref, resolveOpts);
    if (!resolved.ok) return resolved;

    const unit = resolved.value.loaded;
    const name = String(unit.twinfile.id ?? '');
    const kind = String(unit.twinfile.kind ?? '');
    const typed = parseTwinfileRef(ref);
    if (typed?.kind && typed.kind !== kind) {
      return err([
        {
          code: 'E_BUILD',
          message: `Ref ${ref} declares kind ${typed.kind}; unit is ${kind}`,
          file: scenario.twinfilePath,
        },
      ]);
    }
    if (kind !== 'event') {
      return err([
        {
          code: 'E_BUILD',
          message: `Compose ref ${ref} is kind ${kind}; expected event`,
          file: scenario.twinfilePath,
        },
      ]);
    }

    events.push(unit.twinfile);
    layers.push(...readManifestLayers(unit, `event/${name}/`, 'place'));
    const binding = findSituationBindingForTarget(place, name, placeInherit);
    if (!binding.ok) return binding;
    if (binding.value) {
      layers.push(situationBindingLayer(bindingLayerRef(binding.value.rel), binding.value.planRoles));
    }
    contracts.push({
      unitName: name,
      expects: asExpects(unit.twinfile),
      ...(binding.value ? { planRoles: binding.value.planRoles } : {}),
    });
  }

  if (isPatchesTwinfile(scenario.twinfile)) {
    for (const step of listTwinfileInstructions(scenario)) {
      if (step.type !== 'patch') continue;
      layers.push({
        ref: `scenario/${step.ref}`,
        kind: 'patch',
        patch: step.doc,
        ...(step.mergeMode !== 'patch' ? { mergeMode: step.mergeMode } : {}),
      });
    }
  } else {
    for (const rel of twinfileLayerPaths(scenario.twinfile)) {
      const parsed = readYamlDocument(join(scenario.root, rel));
      layers.push({ ref: `scenario/${rel}`, kind: 'patch', patch: parsed.value });
    }
  }

  const resolvedArgs = resolveScenarioArgs(scenario);
  if (Object.keys(resolvedArgs).length > 0) {
    layers.push({ ref: 'scenario/args', kind: 'args', patch: resolvedArgs });
  }

  return ok({
    layers,
    place,
    events,
    situationBindingDocs: loadSituationBindingDocuments(place, placeInherit),
    contracts,
    resolvedArgs,
  });
}

