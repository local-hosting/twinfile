import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
