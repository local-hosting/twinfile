import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

export type CrosswalkRow = {
  source: string;
  term: string;
  collection?: string;
  field?: string;
  ext?: boolean;
  values?: Record<string, string>;
};

const require = createRequire(import.meta.url);

const PLACE_COLLECTIONS = new Set([
  'place',
  'levels',
  'spaces',
  'openings',
  'stations',
  'routes',
  'sensors',
  'assets',
  'feed',
]);

let cached: CrosswalkRow[] | undefined;

export function crosswalkPath(): string {
  const fromPkg = join(dirname(require.resolve('@doppler-group/twinfile-spec/package.json')), 'conf', 'crosswalk.yaml');
  if (statSync(fromPkg, { throwIfNoEntry: false })?.isFile()) return fromPkg;
  const monorepo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'spec', 'conf', 'crosswalk.yaml');
  if (statSync(monorepo, { throwIfNoEntry: false })?.isFile()) return monorepo;
  return fromPkg;
}

export function loadCrosswalk(): CrosswalkRow[] {
  if (cached) return cached;
  const doc = parseYaml(readFileSync(crosswalkPath(), 'utf8')) as { rows?: unknown };
  if (!Array.isArray(doc.rows) || doc.rows.length === 0) throw new Error('crosswalk: missing rows');
  const rows: CrosswalkRow[] = [];
  for (const raw of doc.rows) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('crosswalk: row must be an object');
    const row = raw as Record<string, unknown>;
    const source = String(row.source ?? '');
    const term = String(row.term ?? '');
    if (!source || !term) throw new Error('crosswalk: row needs source and term');
    const values = row.values;
    rows.push({
      source,
      term,
      ...(typeof row.collection === 'string' ? { collection: row.collection } : {}),
      ...(typeof row.field === 'string' ? { field: row.field } : {}),
      ...(row.ext === true ? { ext: true } : {}),
      ...(values && typeof values === 'object' && !Array.isArray(values)
        ? { values: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])) }
        : {}),
    });
  }
  cached = rows;
  return rows;
}

export function clearCrosswalkCacheForTests(): void {
  cached = undefined;
}

export function crosswalkRows(source: string, term: string): CrosswalkRow[] {
  return loadCrosswalk().filter((row) => row.source === source && row.term === term);
}

/** Mapped Twinfile value for a closed list. Missing keys fail. */
export function crosswalkValue(source: string, term: string, collection: string, field: string, raw: string): string {
  const row = crosswalkRows(source, term).find((item) => item.collection === collection && item.field === field && item.values);
  if (!row?.values) throw new Error(`crosswalk: ${source}.${term} has no ${collection}.${field} value map`);
  const mapped = row.values[raw];
  if (mapped === undefined) throw new Error(`crosswalk: ${source}.${term} has no value for "${raw}"`);
  return mapped;
}

/** Role or other optional value. Absent keys mean no tag. */
export function optionalCrosswalkValue(
  source: string,
  term: string,
  collection: string,
  field: string,
  raw: string,
): string | undefined {
  const row = crosswalkRows(source, term).find((item) => item.collection === collection && item.field === field && item.values);
  return row?.values?.[raw];
}

/**
 * Leftover source fields. A term mapped onto this collection's field must already
 * have been stored there. `ext: true` and unknown terms stay in ext.
 */
export function unmappedExt(
  source: string,
  collection: string,
  props: Record<string, unknown>,
  consumed: string[],
): Record<string, unknown> {
  const skip = new Set(consumed);
  const ext: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (skip.has(key) || value === undefined || value === null) continue;
    const owned = crosswalkRows(source, key).find((row) => row.collection === collection && row.field && row.ext !== true);
    if (owned) {
      throw new Error(`crosswalk: ${source} ${collection}.${key} must be stored as ${owned.field}`);
    }
    ext[key] = value;
  }
  return ext;
}

/** A mapped term must not be sitting in ext on the collection that owns it. */
export function assertCrosswalkPlacement(source: string, document: unknown): void {
  walk(source, document, undefined);
}

function walk(source: string, value: unknown, collection: string | undefined): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(source, item, collection);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (collection && record.ext && typeof record.ext === 'object' && !Array.isArray(record.ext)) {
    for (const key of Object.keys(record.ext as Record<string, unknown>)) {
      const owned = crosswalkRows(source, key).find((row) => row.collection === collection && row.field && row.ext !== true);
      if (owned) {
        throw new Error(`crosswalk: ${source} ${collection}.ext.${key} belongs in ${owned.field}`);
      }
    }
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === 'ext') continue;
    const next = Array.isArray(child) || PLACE_COLLECTIONS.has(key) ? key : collection;
    walk(source, child, next);
  }
}
