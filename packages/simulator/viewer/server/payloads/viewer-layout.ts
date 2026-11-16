import { filterPlaceRowsByUseMode } from '@doppler-group/twinfile-place';
import type { TwinfileUseMode } from '@doppler-group/twinfile-core';

import type { LayoutOverview } from '../../types/workbench-api.js';

function geoFromPlace(place: Record<string, unknown> | undefined): LayoutOverview['geo'] {
  if (!place) return undefined;
  const ext = place.ext as Record<string, unknown> | undefined;
  const lat = ext?.lat ?? place.lat;
  const lon = ext?.lon ?? place.lon;
  if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }
  return undefined;
}

export function buildLayoutOverview(
  mergedPlace: Record<string, unknown>,
  mode?: TwinfileUseMode,
): LayoutOverview {
  const place = mergedPlace.place as Record<string, unknown> | undefined;
  const spacesRawUnfiltered = (mergedPlace.spaces as Record<string, unknown>[] | undefined) ?? [];
  const openingsRawUnfiltered = (mergedPlace.openings as Record<string, unknown>[] | undefined) ?? [];
  const routesRawUnfiltered = (mergedPlace.routes as Record<string, unknown>[] | undefined) ?? [];
  const spacesRaw = mode ? filterPlaceRowsByUseMode(spacesRawUnfiltered, mode) : spacesRawUnfiltered;
  const openingsRaw = mode ? filterPlaceRowsByUseMode(openingsRawUnfiltered, mode) : openingsRawUnfiltered;
  const routesRaw = mode ? filterPlaceRowsByUseMode(routesRawUnfiltered, mode) : routesRawUnfiltered;
  const levelsRaw = (mergedPlace.levels as Record<string, unknown>[] | undefined) ?? [];

  return {
    ...(typeof place?.name === 'string' ? { placeName: place.name } : {}),
    ...(typeof place?.archetype === 'string' ? { layoutArchetype: place.archetype } : {}),
    ...(geoFromPlace(place) ? { geo: geoFromPlace(place) } : {}),
    levels: levelsRaw
      .map((row) => ({
        id: String(row.id ?? ''),
        ...(typeof row.name === 'string' ? { name: row.name } : {}),
      }))
      .filter((row) => row.id.length > 0),
    spaces: spacesRaw
      .map((row) => ({
        id: String(row.id ?? ''),
        ...(typeof row.name === 'string' ? { name: row.name } : {}),
        ...(typeof row.level === 'string' ? { level: row.level } : {}),
        ...(typeof row.exposure === 'string' ? { exposure: row.exposure } : {}),
        ...(typeof row.kind === 'string' ? { kind: row.kind } : {}),
        ...(typeof row.parent === 'string' ? { parent: row.parent } : {}),
        ...(Array.isArray(row.roles)
          ? { roles: row.roles.map((tag) => String(tag)).filter((tag) => tag.length > 0) }
          : {}),
      }))
      .filter((row) => row.id.length > 0),
    openings: openingsRaw
      .map((row) => {
        const connects = Array.isArray(row.connects)
          ? row.connects.map(String).filter((id) => id.length > 0)
          : [];
        return {
          id: String(row.id ?? ''),
          ...(typeof row.kind === 'string' ? { kind: row.kind } : {}),
          connects,
          ...(typeof row.state === 'string' ? { state: row.state } : {}),
        };
      })
      .filter((row) => row.id.length > 0),
    routes: routesRaw
      .map((row) => ({
        id: String(row.id ?? ''),
        ...(typeof row.name === 'string' ? { name: row.name } : {}),
        from: typeof row.from === 'string' ? row.from : '',
        to: typeof row.to === 'string' ? row.to : '',
        ...(typeof row.length_m === 'number' ? { length_m: row.length_m } : {}),
        ...(typeof row.kind === 'string' ? { kind: row.kind } : {}),
      }))
      .filter((row) => row.id.length > 0 && row.from.length > 0 && row.to.length > 0),
  };
}
