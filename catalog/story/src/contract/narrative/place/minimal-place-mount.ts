import type { PlaceMount } from '../types/place-mount.js';

import type { GeoAnchorV1 } from '../venue/rank-venues-near-anchor.js';

export type MinimalPlaceMountInput = {
  venueKey: string;
  title?: string;
  lat?: number;
  lon?: number;
};

function geoFromLatLon(lat?: number, lon?: number): { lat: number; lon: number } | undefined {
  if (lat == null || lon == null) return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return { lat, lon };
}

/** Portable venue mount without an external unit ref (geo-only or id-only). */
export function minimalPlaceMount(input: MinimalPlaceMountInput): PlaceMount {
  const venueKey = input.venueKey.trim();
  const title = input.title?.trim() || venueKey;
  const geo = geoFromLatLon(input.lat, input.lon);
  return {
    venueKey,
    title,
    spaceIds: [],
    ...(geo ? { geo } : {}),
  };
}

export function minimalPlaceMountFromGeoAnchor(
  anchor: GeoAnchorV1,
  venueKey = 'venue:geo-anchor',
): PlaceMount {
  return minimalPlaceMount({
    venueKey,
    title: venueKey.replace(/^venue:/, '') || 'geo-anchor',
    lat: anchor.lat,
    lon: anchor.lon,
  });
}

export function mergePlaceMountsByVenueKey(
  mounts: readonly PlaceMount[],
): PlaceMount[] {
  const map = new Map<string, PlaceMount>();
  for (const mount of mounts) {
    const key = mount.venueKey.trim();
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, mount);
      continue;
    }
    const existingSpaces = existing.spaceIds?.length ?? 0;
    const nextSpaces = mount.spaceIds?.length ?? 0;
    if (nextSpaces > existingSpaces) {
      map.set(key, mount);
      continue;
    }
    if (nextSpaces < existingSpaces) {
      continue;
    }
    const existingGeo = existing.geo != null;
    const nextGeo = mount.geo != null;
    if (!existingGeo && nextGeo) {
      map.set(key, mount);
    }
  }
  return [...map.values()];
}
