import { parseTwinfileRef, placeRefIdentity, type TwinfileRef } from '@local-hosting/twinfile-core/ref';

import type { PlaceMount } from '../types/place-mount.js';

import type { GeoAnchorV1 } from './rank-places-near-anchor.js';

export type MinimalPlaceMountInput = {
  placeRef: TwinfileRef;
  title?: string;
  lat?: number;
  lon?: number;
};

function geoFromLatLon(lat?: number, lon?: number): { lat: number; lon: number } | undefined {
  if (lat == null || lon == null) return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return { lat, lon };
}

/** Portable place mount without published layout (geo-only or id-only). */
export function minimalPlaceMount(input: MinimalPlaceMountInput): PlaceMount {
  const placeRef = input.placeRef.trim();
  const parsed = parseTwinfileRef(placeRef);
  if (!parsed) {
    throw new Error(`minimalPlaceMount: invalid placeRef "${placeRef}"`);
  }
  const title = input.title?.trim() || parsed.name;
  const geo = geoFromLatLon(input.lat, input.lon);
  return {
    placeRef,
    title,
    spaceIds: [],
    ...(geo ? { geo } : {}),
  };
}

export function minimalPlaceMountFromGeoAnchor(
  anchor: GeoAnchorV1,
  placeRef: TwinfileRef = 'twinfile/place/geo-anchor:0.0.0',
): PlaceMount {
  return minimalPlaceMount({ placeRef, lat: anchor.lat, lon: anchor.lon });
}

/** One mount per place (kind + name); prefers richer layout, then geo. */
export function mergePlaceMountsByPlaceRef(mounts: readonly PlaceMount[]): PlaceMount[] {
  const map = new Map<string, PlaceMount>();
  for (const mount of mounts) {
    const key = placeRefIdentity(mount.placeRef);
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
    if (existing.geo == null && mount.geo != null) {
      map.set(key, mount);
    }
  }
  return [...map.values()];
}
