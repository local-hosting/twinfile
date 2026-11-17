import { GeoPointSchema, PlaceRefSchema, type GeoPoint, type PlaceRef } from './place.schema.js';

export function parsePlaceRef(input: unknown): PlaceRef {
  return PlaceRefSchema.parse(input);
}

export function geoPointFromPlace(place: PlaceRef): GeoPoint | undefined {
  if (place.lat == null || place.lon == null) return undefined;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return undefined;
  return GeoPointSchema.parse({ lat: place.lat, lon: place.lon });
}

/** @deprecated Prefer {@link PlaceRef.role}. */
export function resolvePlaceGeotypeSlug(place: PlaceRef): string | undefined {
  return place.role ?? place.geotypeSlug;
}
