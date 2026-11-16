import { cellToLatLng } from 'h3-js';
import { parseAllDocuments } from 'yaml';

import { splitEditorBuffer } from './serialize-twinfile.js';
import type {
  LngLat,
  MapCamera,
  MapDraft,
  TwinfileFeature,
  TwinfileGeometry,
} from './types/map-draft.js';

const EMPTY_CAMERA: MapCamera = { lat: 0, lng: 0, zoom: 1 };

/** Parse the editor buffer into geokit features. Invalid YAML keeps sibling files. */
export function draftMapFromText(text: string): MapDraft {
  const features: TwinfileFeature[] = [];
  const errors: string[] = [];

  for (const section of splitEditorBuffer(text)) {
    const body = section.body.trim();
    if (!body) continue;
    try {
      for (const value of parseSection(body)) walkValue(value, section.path, features);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid YAML';
      errors.push(`${section.path}: ${message}`);
    }
  }

  return {
    features,
    camera: cameraFor(features),
    ...(errors.length > 0 ? { parseError: errors.join('\n') } : {}),
  };
}

export function featureCollection(features: TwinfileFeature[]): {
  type: 'FeatureCollection';
  features: TwinfileFeature[];
} {
  return { type: 'FeatureCollection', features };
}

function parseSection(body: string): unknown[] {
  const docs = parseAllDocuments(body);
  return docs.map((doc) => {
    if (doc.errors.length > 0) throw doc.errors[0];
    return doc.toJS();
  });
}

type Label = { id?: string; name?: string; h3?: string; anchorH3?: boolean };

const H3_INDEX = /^[0-9a-f]{15}$/i;

function walkValue(value: unknown, file: string, into: TwinfileFeature[], label: Label = {}): void {
  if (Array.isArray(value)) {
    for (const item of value) walkValue(item, file, into, label);
    return;
  }
  if (!value || typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  if (record.type === 'FeatureCollection' && Array.isArray(record.features)) {
    walkValue(record.features, file, into, label);
    return;
  }

  const next = inheritLabel(record, label);
  const geometry = geometryOf(record);
  if (geometry) {
    into.push(featureFrom(next, geometry, file, into.length));
    if (isGeoJson(record)) return;
  }

  let extH3: string | undefined;
  let locationFrom = -1;
  let locationTo = -1;
  for (const [key, child] of Object.entries(record)) {
    if (key === 'coordinates' || key === 'geometry') continue;
    if (key === 'ext') extH3 = h3IndexOf(field(child, 'h3')) ?? extH3;
    const mark = into.length;
    walkValue(child, file, into, next);
    if (key === 'ext') pinFromPlaceholderExt(child, next, file, into, mark);
    if (key === 'location') {
      locationFrom = mark;
      locationTo = into.length;
    }
  }

  if (!extH3 || locationFrom < 0) return;
  for (let index = locationFrom; index < locationTo; index += 1) {
    const feature = into[index];
    if (feature && !feature.properties.h3) feature.properties.h3 = extH3;
  }
}

function featureFrom(label: Label, geometry: TwinfileGeometry, file: string, index: number): TwinfileFeature {
  const name = label.name;
  return {
    type: 'Feature',
    geometry,
    properties: {
      id: label.id ?? name ?? `${file}:${index}`,
      file,
      ...(name ? { name } : {}),
      ...(label.h3 ? { h3: label.h3 } : {}),
      ...(label.anchorH3 ? { anchorH3: true } : {}),
    },
  };
}

function inheritLabel(record: Record<string, unknown>, parent: Label): Label {
  const props = record.properties;
  const extra =
    props && typeof props === 'object' && !Array.isArray(props)
      ? (props as Record<string, unknown>)
      : undefined;
  const id = textOf(record.id) ?? textOf(extra?.id) ?? parent.id;
  const name = textOf(record.name) ?? textOf(extra?.name) ?? parent.name;
  const h3 = h3IndexOf(record.h3) ?? h3IndexOf(extra?.h3) ?? parent.h3;
  return { ...(id ? { id } : {}), ...(name ? { name } : {}), ...(h3 ? { h3 } : {}) };
}

function h3IndexOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const index = value.trim().toLowerCase();
  return H3_INDEX.test(index) ? index : undefined;
}

function field(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return (value as Record<string, unknown>)[key];
}

/** Golden bases keep 0,0 for layout — derive the editor pin from `ext.h3` instead. */
function pinFromPlaceholderExt(
  ext: unknown,
  label: Label,
  file: string,
  into: TwinfileFeature[],
  fromIndex: number,
): void {
  const h3 = h3IndexOf(field(ext, 'h3'));
  if (!h3) return;
  const addedPoint = into
    .slice(fromIndex)
    .some((feature) => feature.geometry.type === 'Point');
  if (addedPoint) return;

  let center: [number, number];
  try {
    center = cellToLatLng(h3);
  } catch {
    return;
  }
  const [lat, lng] = center;
  into.push(
    featureFrom(
      { ...label, h3, anchorH3: true },
      { type: 'Point', coordinates: [lng, lat] },
      file,
      into.length,
    ),
  );
}

function geometryOf(record: Record<string, unknown>): TwinfileGeometry | undefined {
  if (record.type === 'Feature' && record.geometry && typeof record.geometry === 'object') {
    return geometryOf(record.geometry as Record<string, unknown>);
  }

  const kind = record.type;
  if (kind === 'Point' || kind === 'LineString' || kind === 'Polygon') {
    return geometryFromCoordinates(kind, record.coordinates);
  }

  const lat = numberOf(record.lat ?? record.latitude);
  const lng = numberOf(record.lng ?? record.lon ?? record.longitude);
  if (lat === undefined || lng === undefined) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  // Golden bases use 0,0 to satisfy archetype anchor checks — not a real map pin.
  if (lat === 0 && lng === 0) return undefined;
  return { type: 'Point', coordinates: [lng, lat] };
}

function geometryFromCoordinates(
  kind: 'Point' | 'LineString' | 'Polygon',
  coordinates: unknown,
): TwinfileGeometry | undefined {
  switch (kind) {
    case 'Point': {
      const point = asLngLat(coordinates);
      return point ? { type: 'Point', coordinates: point } : undefined;
    }
    case 'LineString': {
      const line = asLine(coordinates);
      return line ? { type: 'LineString', coordinates: line } : undefined;
    }
    case 'Polygon': {
      const polygon = asPolygon(coordinates);
      return polygon ? { type: 'Polygon', coordinates: polygon } : undefined;
    }
    default: {
      const unreachable: never = kind;
      throw new Error(`Unknown geometry ${String(unreachable)}`);
    }
  }
}

function asLngLat(value: unknown): LngLat | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const lng = numberOf(value[0]);
  const lat = numberOf(value[1]);
  if (lng === undefined || lat === undefined) return undefined;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return undefined;
  return [lng, lat];
}

function asLine(value: unknown): LngLat[] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const line: LngLat[] = [];
  for (const point of value) {
    const lngLat = asLngLat(point);
    if (!lngLat) return undefined;
    line.push(lngLat);
  }
  return line;
}

function asPolygon(value: unknown): LngLat[][] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const rings: LngLat[][] = [];
  for (const ring of value) {
    const line = asLine(ring);
    if (!line) return undefined;
    rings.push(line);
  }
  return rings;
}

function cameraFor(features: TwinfileFeature[]): MapCamera {
  const coords = positionsOf(features);
  if (coords.length === 0) return EMPTY_CAMERA;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const span = Math.max(maxLat - minLat, maxLng - minLng);
  const zoom = span < 1e-4 ? 16 : Math.max(2, Math.min(16, Math.log2(360 / span) - 0.5));
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
    zoom: Number(zoom.toFixed(2)),
  };
}

function positionsOf(features: TwinfileFeature[]): LngLat[] {
  const coords: LngLat[] = [];
  for (const feature of features) {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        coords.push(geometry.coordinates);
        break;
      case 'LineString':
        coords.push(...geometry.coordinates);
        break;
      case 'Polygon':
        coords.push(...geometry.coordinates.flat());
        break;
      default: {
        const unreachable: never = geometry;
        throw new Error(`Unknown geometry ${String(unreachable)}`);
      }
    }
  }
  return coords;
}

function isGeoJson(record: Record<string, unknown>): boolean {
  return (
    record.type === 'Feature' ||
    record.type === 'Point' ||
    record.type === 'LineString' ||
    record.type === 'Polygon'
  );
}

function numberOf(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
