import { stringify } from 'yaml';

import type { ImportResult } from './types.js';

export type PlaceRow = Record<string, unknown>;

const GEOTYPE_REGISTRY = '@doppler-group/geotypes@0.2.0';

/** Unit head suffix; `writeImportedFiles` renames the head to `<dir>.twin.yaml`. */
export const TWIN_HEAD_SUFFIX = '.twin.yaml';

export function twinId(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  const id = slug || 'id';
  return /^[a-z0-9]/.test(id) ? id : `n${id}`.slice(0, 63);
}

export function asImportRecord(value: unknown, where: string): PlaceRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${where}: expected an object`);
  }
  return value as PlaceRow;
}

export function readImportName(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as PlaceRow;
    if (typeof record.en === 'string') return record.en;
    const first = Object.values(record).find((item) => typeof item === 'string');
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export function withImportExt(row: PlaceRow, ext: PlaceRow): PlaceRow {
  return Object.keys(ext).length > 0 ? { ...row, ext } : row;
}

function titleFromId(id: string): string {
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Scaffold a place twinfile directory from merged place layer documents. */
export function packPlaceUnit(name: string, geotype: string, docs: PlaceRow[]): ImportResult {
  const layers = docs.map((doc) => {
    const key = Object.keys(doc)[0];
    if (!key) throw new Error('import: empty place document');
    return `place/${key === 'place' ? 'place' : key}.yaml`;
  });
  const files: Record<string, string> = {
    [`${name}${TWIN_HEAD_SUFFIX}`]: stringify({
      twinfile: 1,
      kind: 'place',
      id: name,
      name: titleFromId(name),
      version: '0.1.0',
      stability: 'example',
      geotype: { primary: geotype, registry: GEOTYPE_REGISTRY },
      layers,
    }),
  };
  const place: PlaceRow = {};
  for (const doc of docs) {
    const key = Object.keys(doc)[0];
    if (!key) continue;
    files[`place/${key}.yaml`] = stringify(doc);
    Object.assign(place, doc);
  }
  return { files, place };
}
