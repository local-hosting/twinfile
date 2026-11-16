import type { PlaceMount } from '../types/place-mount.js';

export type GeoAnchorV1 = {
  lat: number;
  lon: number;
};

export type RankedPlaceMountNearAnchorV1 = {
  mount: PlaceMount;
  distanceKm: number;
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceKmBetween(a: GeoAnchorV1, b: GeoAnchorV1): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function rankPlaceMountsNearAnchor(
  mounts: readonly PlaceMount[],
  anchor: GeoAnchorV1,
  limit = 8,
): RankedPlaceMountNearAnchorV1[] {
  const ranked = mounts.map((mount) => {
    const geo = mount.geo;
    const distanceKm =
      geo != null ? distanceKmBetween(anchor, geo) : Number.POSITIVE_INFINITY;
    return { mount, distanceKm };
  });
  return ranked.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, Math.max(limit, 1));
}
