import type {
  VenueLayoutAxmContribution,
  VenueLayoutMountWire,
} from '../types/venue-layout-mount-wire.js';

export const VENUE_LAYOUT_MOUNT_TOOLING = {
  name: '@doppler-group/twinfile-place',
  version: '0.0.1',
} as const;

function readSpaces(raw: unknown): VenueLayoutMountWire['spaces'] {
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

export function venueLayoutMountFromJson(json: unknown): VenueLayoutMountWire {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('invalid venue layout mount JSON');
  }
  const record = json as Record<string, unknown>;
  const id = String(record.id ?? '').trim();
  if (!id) {
    throw new Error('venue layout mount missing id');
  }
  const title = String(record.title ?? id).trim() || id;
  return {
    version: typeof record.version === 'number' ? record.version : 1,
    id,
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
    levels: Array.isArray(record.levels) ? (record.levels as VenueLayoutMountWire['levels']) : [],
    spaces: readSpaces(record.spaces),
    pathways: Array.isArray(record.pathways)
      ? (record.pathways as VenueLayoutMountWire['pathways'])
      : [],
    ...(Array.isArray(record.moments) ? { moments: record.moments as VenueLayoutMountWire['moments'] } : {}),
    ...(Array.isArray(record.fixtures)
      ? { fixtures: record.fixtures as VenueLayoutMountWire['fixtures'] }
      : {}),
  };
}

export function venueLayoutMountToJson(wire: VenueLayoutMountWire): Record<string, unknown> {
  return {
    version: wire.version ?? 1,
    id: wire.id,
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

export function venueLayoutToAxmContribution(wire: VenueLayoutMountWire): VenueLayoutAxmContribution {
  return {
    venueKey: wire.id,
    levels: wire.levels ?? [],
    spaces: wire.spaces ?? [],
    pathways: wire.pathways ?? [],
    ...(wire.moments?.length ? { moments: wire.moments } : {}),
    ...(wire.fixtures?.length ? { fixtures: wire.fixtures } : {}),
  };
}
