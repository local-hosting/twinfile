import { readFileSync, writeFileSync } from 'node:fs';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { normalizeManifestV2Keys } from '../patch/module-graph-twinfile.js';
import {
  isBindingLayerPath,
  twinfileBindingPaths,
  parseManifestLayerEntries,
  type ManifestLayerEntry,
} from '../load/twinfile-paths.js';

const PLACE_MANIFEST_ORDER = [
  'from',
  'with',
  'twinfile',
  'kind',
  'id',
  'name',
  'version',
  'stability',
  'geotype',
  'axes',
  'layers',
  'steps',
  'processors',
] as const;

function layerEntryToYaml(entry: ManifestLayerEntry): string | Record<string, unknown> {
  if (entry.mode === 'replace') {
    return { path: entry.path, mode: 'replace' };
  }
  return entry.path;
}

/** Merge legacy binding lists into `layers:` and drop side lists. `steps:` units: normalize module I/O keys. */
export function normalizeManifestStack(twinfile: Record<string, unknown>): Record<string, unknown> {
  if (twinfile.twinfile === 2) {
    let out = { ...twinfile };
    delete out.layers;
    delete out.with;
    delete out.buildings;
    delete out.plans;
    delete out.bindings;
    out = normalizeManifestV2Keys(out);
    return out;
  }
  const placeLayers = parseManifestLayerEntries(twinfile).filter((e) => !isBindingLayerPath(e.path));
  const planPaths = twinfileBindingPaths(twinfile);
  const seen = new Set(placeLayers.map((e) => e.path));
  const layers: Array<string | Record<string, unknown>> = placeLayers.map(layerEntryToYaml);
  for (const plan of planPaths) {
    if (seen.has(plan)) continue;
    seen.add(plan);
    layers.push(plan);
  }
  const out: Record<string, unknown> = { ...twinfile, layers };
  delete out.plans;
  return out;
}

export function orderPlaceTwinfileKeys(twinfile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PLACE_MANIFEST_ORDER) {
    if (key in twinfile) out[key] = twinfile[key];
  }
  for (const [key, value] of Object.entries(twinfile)) {
    if (!(key in out)) out[key] = value;
  }
  return out;
}

export function formatPlaceManifestFile(twinfilePath: string, options: { write?: boolean } = {}): Record<string, unknown> {
  const raw = parseYaml(readFileSync(twinfilePath, 'utf8')) as Record<string, unknown>;
  let twinfile = normalizeManifestStack(raw);
  twinfile = orderPlaceTwinfileKeys(twinfile);
  if (options.write !== false) {
    writeFileSync(twinfilePath, stringifyYaml(twinfile));
  }
  return twinfile;
}
