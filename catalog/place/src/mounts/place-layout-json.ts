import { isTwinfileRef } from '@doppler-group/twinfile-core';

import type { PlaceLayoutAxmContribution, PlaceLayoutWire } from '../types/place-layout-wire.js';

export const PLACE_LAYOUT_TOOLING = {
  name: '@doppler-group/twinfile-place',
  version: '0.0.1',
} as const;

function readSpaces(raw: unknown): PlaceLayoutWire['spaces'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => ({
      id: String(row.id ?? ''),
      ...(typeof row.label === 'string' ? { label: row.label } : {}),
      ...(typeof row.order === 'number' ? { order: row.order } : {}),
    }))
    .filter((row) => row.id.length > 0);
}

export function placeLayoutFromJson(json: unknown): PlaceLayoutWire {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('invalid place layout JSON');
  }
  const record = json as Record<string, unknown>;
  const placeRef = String(record.placeRef ?? '').trim();
  if (!isTwinfileRef(placeRef)) {
    throw new Error(`place layout missing valid placeRef (got "${placeRef}")`);
  }
  const title = String(record.title ?? placeRef).trim() || placeRef;
  return {
    version: typeof record.version === 'number' ? record.version : 1,
    placeRef,
    title,
    ...(typeof record.revision === 'number' ? { revision: record.revision } : {}),
    ...(record.geo &&
    typeof record.geo === 'object' &&
    !Array.isArray(record.geo) &&
    typeof (record.geo as { lat?: unknown }).lat === 'number' &&
    typeof (record.geo as { lon?: unknown }).lon === 'number'
      ? {
          geo: {
            lat: (record.geo as { lat: number }).lat,
            lon: (record.geo as { lon: number }).lon,
          },
        }
      : {}),
    levels: Array.isArray(record.levels) ? (record.levels as PlaceLayoutWire['levels']) : [],
    spaces: readSpaces(record.spaces),
    pathways: Array.isArray(record.pathways) ? (record.pathways as PlaceLayoutWire['pathways']) : [],
    ...(Array.isArray(record.moments) ? { moments: record.moments as PlaceLayoutWire['moments'] } : {}),
    ...(Array.isArray(record.fixtures) ? { fixtures: record.fixtures as PlaceLayoutWire['fixtures'] } : {}),
  };
}

export function placeLayoutToJson(wire: PlaceLayoutWire): Record<string, unknown> {
  return {
    version: wire.version ?? 1,
    placeRef: wire.placeRef,
    title: wire.title,
    ...(wire.revision != null ? { revision: wire.revision } : {}),
    ...(wire.geo ? { geo: wire.geo } : {}),
    levels: wire.levels ?? [],
    spaces: wire.spaces ?? [],
    pathways: wire.pathways ?? [],
    ...(wire.moments?.length ? { moments: wire.moments } : {}),
    ...(wire.fixtures?.length ? { fixtures: wire.fixtures } : {}),
  };
}

export function placeLayoutToAxmContribution(wire: PlaceLayoutWire): PlaceLayoutAxmContribution {
  return {
    placeRef: wire.placeRef,
    levels: wire.levels ?? [],
    spaces: wire.spaces ?? [],
    pathways: wire.pathways ?? [],
    ...(wire.moments?.length ? { moments: wire.moments } : {}),
    ...(wire.fixtures?.length ? { fixtures: wire.fixtures } : {}),
  };
}
