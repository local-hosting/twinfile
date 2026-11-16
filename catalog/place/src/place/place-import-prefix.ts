import type { PlaceData } from '@local-hosting/twinfile-core';

const ID_ARRAY_KEYS = [
  'levels',
  'spaces',
  'openings',
  'routes',
  'assets',
  'services',
  'sensors',
  'ai',
  'markers',
  'gauges',
  'stations',
  'visits',
  'tracks',
] as const;

function collectIds(place: PlaceData): Set<string> {
  const ids = new Set<string>();
  for (const key of ID_ARRAY_KEYS) {
    const rows = place[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (row && typeof row === 'object' && typeof row.id === 'string') ids.add(row.id);
    }
  }
  return ids;
}

function rewriteRef(
  value: string,
  owned: Set<string>,
  prefix: string,
  anchorId: string | undefined,
  field: string,
): string {
  if (field === 'parent' && value === anchorId) return value;
  if (owned.has(value)) return `${prefix}${value}`;
  return value;
}

function rewriteRow(
  row: Record<string, unknown>,
  owned: Set<string>,
  prefix: string,
  anchorId: string | undefined,
): Record<string, unknown> {
  const originalId = typeof row.id === 'string' ? row.id : '';
  const hadParent = typeof row.parent === 'string' && row.parent.trim();
  const out: Record<string, unknown> = { ...row };
  if (typeof out.id === 'string') out.id = `${prefix}${out.id}`;
  const stringFields = ['level', 'space', 'parent', 'from', 'to'] as const;
  for (const key of stringFields) {
    const v = out[key];
    if (typeof v === 'string' && v.trim()) {
      out[key] = rewriteRef(v.trim(), owned, prefix, anchorId, key);
    }
  }
  if (Array.isArray(out.connects)) {
    out.connects = out.connects.map((c) =>
      typeof c === 'string' && owned.has(c) ? `${prefix}${c}` : c,
    );
  }
  if (anchorId && !hadParent && owned.has(originalId)) {
    out.parent = anchorId;
  }
  return out;
}

/** Prefix ids in a copied place slice; with an anchor, unparented rows hang under it. */
export function prefixImportedPlaceData(
  place: PlaceData,
  prefix: string,
  anchorId: string | undefined,
  options: { stripPlace?: boolean; stripLevels?: boolean } = {},
): PlaceData {
  const owned = collectIds(place);
  if (options.stripLevels) {
    for (const row of place.levels ?? []) {
      if (row && typeof row === 'object' && typeof row.id === 'string') owned.delete(row.id);
    }
  }
  const out: PlaceData = {};
  if (!options.stripPlace && place.place && typeof place.place === 'object') {
    out.place = place.place;
  }
  for (const key of ID_ARRAY_KEYS) {
    if (options.stripLevels && key === 'levels') continue;
    const rows = place[key];
    if (!Array.isArray(rows)) continue;
    out[key] = rows.map((row) =>
      rewriteRow(row as Record<string, unknown>, owned, prefix, anchorId),
    ) as PlaceData[typeof key];
  }
  return out;
}
