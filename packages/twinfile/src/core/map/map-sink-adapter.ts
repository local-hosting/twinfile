/** Wires accepted by `twinfile/mod.map-sink@0.1.0` hosts ([host adapters](../../../spec/doc/pack/adapters/host.md)). */
export type MapSinkWire = 'place:merged' | 'place:building' | 'place:site';

export type MapSinkSliceOptions = {
  /** Required when `wire` is `place:building` — building anchor space id. */
  buildingAnchor?: string;
};

function buildingPrefix(anchor: string): string {
  return `${anchor}-`;
}

function rowInBuilding(id: string, anchor: string): boolean {
  return id === anchor || id.startsWith(buildingPrefix(anchor));
}

function filterIdRows<T extends { id?: string }>(
  rows: unknown,
  predicate: (id: string) => boolean,
): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row): row is T => {
    if (!row || typeof row !== 'object') return false;
    const id = (row as { id?: string }).id;
    return typeof id === 'string' && predicate(id);
  });
}

/**
 * Slice merged `place` for map viewer inputs — no patch graph logic in the map package.
 */
export function slicePlaceForMapSink(
  place: Record<string, unknown>,
  wire: MapSinkWire,
  options: MapSinkSliceOptions = {},
): Record<string, unknown> {
  if (wire === 'place:merged' || wire === 'place:site') {
    return place;
  }
  const anchor = options.buildingAnchor;
  if (!anchor) {
    throw new Error('slicePlaceForMapSink: buildingAnchor required for place:building');
  }
  const keep = (id: string) => rowInBuilding(id, anchor);
  const out: Record<string, unknown> = { ...place };
  for (const key of Object.keys(place)) {
    const value = place[key];
    if (!Array.isArray(value)) continue;
    if (value[0] && typeof value[0] === 'object' && 'id' in (value[0] as object)) {
      out[key] = filterIdRows(value, keep);
    }
  }
  return out;
}
