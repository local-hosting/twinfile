import type { PlaceMount } from '../types/place-mount.js';

function readStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const ids = raw.filter((row): row is string => typeof row === 'string' && row.trim().length > 0);
  return ids.length > 0 ? ids : undefined;
}

function readLayoutRows(raw: unknown): PlaceMount['layoutSpaces'] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const rows = raw
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => {
      const id = String(row.id ?? '').trim();
      if (!id) {
        return null;
      }
      return {
        id,
        ...(typeof row.label === 'string' ? { label: row.label } : {}),
        ...(typeof row.order === 'number' ? { order: row.order } : {}),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
  return rows.length > 0 ? rows : undefined;
}

function readPathwayRows(raw: unknown): PlaceMount['layoutPathways'] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const rows = raw
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => {
      const id = String(row.id ?? '').trim();
      return id ? { id, ...(typeof row.label === 'string' ? { label: row.label } : {}) } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
  return rows.length > 0 ? rows : undefined;
}

/** Parse a place mount from AXM mount pack JSON (ignores legacy `placeRef` keys). */
export function placeMountFromJson(json: unknown): PlaceMount {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('invalid place mount JSON');
  }
  const record = json as Record<string, unknown>;
  const venueKey = String(record.venueKey ?? '').trim();
  const title = String(record.title ?? '').trim();
  const spaceIds = readStringArray(record.spaceIds) ?? [];
  if (!venueKey) {
    throw new Error('place mount missing venueKey');
  }
  if (!title) {
    throw new Error('place mount missing title');
  }
  const defaultSpaceId =
    typeof record.defaultSpaceId === 'string' ? record.defaultSpaceId : spaceIds[0];
  const visitMomentIds = readStringArray(record.visitMomentIds);
  const layoutLevels = readLayoutRows(record.layoutLevels);
  const layoutSpaces = readLayoutRows(record.layoutSpaces);
  const layoutPathways = readPathwayRows(record.layoutPathways);
  return {
    venueKey,
    title,
    ...(typeof record.venueType === 'string' ? { venueType: record.venueType } : {}),
    ...(typeof record.geotypePrimary === 'string' ? { geotypePrimary: record.geotypePrimary } : {}),
    ...(typeof record.schemaOrgType === 'string' ? { schemaOrgType: record.schemaOrgType } : {}),
    spaceIds,
    ...(defaultSpaceId ? { defaultSpaceId } : {}),
    ...(record.geo &&
    typeof record.geo === 'object' &&
    !Array.isArray(record.geo) &&
    typeof (record.geo as { lat?: unknown }).lat === 'number' &&
    typeof (record.geo as { lon?: unknown }).lon === 'number'
      ? { geo: { lat: (record.geo as { lat: number }).lat, lon: (record.geo as { lon: number }).lon } }
      : {}),
    ...(visitMomentIds ? { visitMomentIds } : {}),
    ...(typeof record.defaultVisitMomentId === 'string'
      ? { defaultVisitMomentId: record.defaultVisitMomentId }
      : {}),
    ...(layoutLevels ? { layoutLevels } : {}),
    ...(layoutSpaces ? { layoutSpaces } : {}),
    ...(layoutPathways ? { layoutPathways } : {}),
  };
}

export function placeMountToJson(mount: PlaceMount): Record<string, unknown> {
  return JSON.parse(JSON.stringify(mount)) as Record<string, unknown>;
}
