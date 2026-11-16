import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
} from '../paths/catalog-layout.js';

import { parse as parseYaml } from 'yaml';

export type TwinLocalMap = Map<string, string>;

function normalizeRefKey(ref: string): string {
  const trimmed = ref.trim();
  if (trimmed.startsWith('twinfile/')) return trimmed;
  return `twinfile/${trimmed}`;
}

/** Load `twin.local.yaml` ref map from examples root (or unit parent). */
function loadTwinLocalMapFromRoot(catalogRoot: string): TwinLocalMap {
  const candidates = [
    join(catalogRoot, 'twin.local.yaml'),
    join(catalogRoot, 'twin.local.yml'),
  ];
  const out = new Map<string, string>();
  for (const path of candidates) {
    if (!statSync(path, { throwIfNoEntry: false })?.isFile()) continue;
    const doc = parseYaml(readFileSync(path, 'utf8')) as { refs?: Record<string, string> };
    if (!doc?.refs || typeof doc.refs !== 'object') continue;
    for (const [key, rel] of Object.entries(doc.refs)) {
      if (typeof rel !== 'string') continue;
      out.set(normalizeRefKey(key), resolve(catalogRoot, rel));
    }
    break;
  }
  return out;
}

/** Load `twin.local.yaml` ref map from one catalog root (`examples/`, `simulator/`, …). */
export function loadTwinLocalMap(catalogRoot: string): TwinLocalMap {
  return loadTwinLocalMapFromRoot(catalogRoot);
}

/** Merge ref maps; later roots override duplicate keys. */
export function mergeTwinLocalMaps(...maps: TwinLocalMap[]): TwinLocalMap {
  const out = new Map<string, string>();
  for (const map of maps) {
    for (const [key, value] of map) {
      out.set(key, value);
    }
  }
  return out;
}

export function resolveTwinLocalPath(ref: string, map: TwinLocalMap): string | undefined {
  return map.get(normalizeRefKey(ref));
}

export function defaultExamplesRoot(): string {
  const fromEnv = process.env.TF_EXAMPLES_ROOT ?? process.env.EXAMPLES_ROOT;
  if (fromEnv) return resolve(fromEnv);
  const corePkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const twinRoot = resolveTwinfileRoot(corePkgRoot);
  return resolveTypeExamplesRoot('place', twinRoot);
}

function firstSimulatorCatalogRoot(examplesRoot: string): string | undefined {
  const candidates = [
    resolve(examplesRoot, '../simulator'),
    resolve(examplesRoot, '../../simulator'),
  ];
  for (const candidate of candidates) {
    if (statSync(join(candidate, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return candidate;
    }
  }
  return undefined;
}

export function defaultSimulatorRoot(): string | undefined {
  const fromEnv = process.env.TF_SIMULATOR_ROOT ?? process.env.SIMULATOR_ROOT;
  if (fromEnv) return resolve(fromEnv);
  return firstSimulatorCatalogRoot(defaultExamplesRoot());
}

/** Examples ref map merged with optional simulator catalog (`TF_SIMULATOR_ROOT`). */
export function loadTwinLocalMapMerged(examplesRoot: string, simulatorRoot?: string): TwinLocalMap {
  const simulator = simulatorRoot ?? defaultSimulatorRoot();
  const maps = [loadTwinLocalMapFromRoot(examplesRoot)];
  if (simulator) maps.push(loadTwinLocalMapFromRoot(simulator));
  return mergeTwinLocalMaps(...maps);
}
