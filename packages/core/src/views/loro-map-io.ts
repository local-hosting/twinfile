/**
 * Twinfile ↔ host LoroMap I/O.
 * Hosts pass PackMap / LoroMap-like objects; twinfile does not import loro WASM.
 */

import {
  prepareTwinfileLoroValue,
  type RenderTwinfileLoroViewOptions,
} from './loro-value.js';

/**
 * Narrow map surface compatible with host pack maps and in-memory fakes.
 * `get` may return `null`/`undefined` for missing keys (PackMap uses `null`).
 */
export type TwinfileLoroMap = {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete?(key: string): boolean | void;
  has?(key: string): boolean;
  keys?(): Iterable<string> | readonly string[];
};

function listTopLevelKeys(map: TwinfileLoroMap): string[] {
  if (!map.keys) return [];
  const keys = [...map.keys()];
  // PackMap may report nested paths (`camera.abc`); twinfile documents use flat roots.
  return keys.filter((key) => !key.includes('.'));
}

function readMapValue(map: TwinfileLoroMap, key: string): unknown {
  const value = map.get(key);
  return value === null || value === undefined ? undefined : value;
}

/** Read a host-passed Loro map into a plain twinfile JSON object. */
export function importTwinfileFromLoroMap(map: TwinfileLoroMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of listTopLevelKeys(map)) {
    const value = readMapValue(map, key);
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Write a twinfile JSON object onto a host-passed Loro map (strip/compact, then set roots).
 * Removes stale top-level keys that are no longer present in `value`.
 */
export function exportTwinfileToLoroMap(
  map: TwinfileLoroMap,
  value: unknown,
  options: RenderTwinfileLoroViewOptions = {},
): void {
  const prepared = prepareTwinfileLoroValue(value, options);
  if (!prepared || typeof prepared !== 'object' || Array.isArray(prepared)) {
    throw new Error('exportTwinfileToLoroMap expects a plain object twinfile payload');
  }
  const next = prepared as Record<string, unknown>;
  for (const key of listTopLevelKeys(map)) {
    if (Object.prototype.hasOwnProperty.call(next, key)) continue;
    map.delete?.(key);
  }
  for (const [key, entry] of Object.entries(next)) {
    map.set(key, entry);
  }
}
