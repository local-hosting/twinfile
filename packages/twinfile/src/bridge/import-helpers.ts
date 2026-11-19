import { twinId } from './place-kit.js';

export type ImportRow = Record<string, unknown>;

export function notedCategory(ext: ImportRow, sourceCategory: string | undefined): ImportRow {
  if (!sourceCategory) return ext;
  return { ...ext, source_category: sourceCategory };
}

export function kindFromToken(token: string | undefined, fallback: string): { kind: string; sourceCategory?: string } {
  if (!token) return { kind: fallback };
  const kind = twinId(token);
  return kind === token ? { kind } : { kind, sourceCategory: token };
}

export function parseCsv(text: string, where: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headerLine = lines[0];
  if (!headerLine) throw new Error(`${where}: empty file`);
  const headers = headerLine.split(',').map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const row: ImportRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

export function isStationStop(stop: ImportRow): boolean {
  const raw = String(stop.location_type ?? '0');
  return raw === '1' || raw === 'station';
}

export function stepFreeKind(kind: string): boolean {
  return kind !== 'stair' && kind !== 'escalator';
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.min(1, Math.sqrt(a))) * 1000) / 1000;
}

export function localType(value: string): string {
  const hash = value.lastIndexOf('#');
  const colon = value.lastIndexOf(':');
  return value.slice(Math.max(hash, colon) + 1);
}

export function localKey(key: string): string {
  const hash = key.lastIndexOf('#');
  const colon = key.lastIndexOf(':');
  return key.slice(Math.max(hash, colon) + 1);
}

export function normalizeKeys(row: ImportRow): ImportRow {
  const out: ImportRow = {};
  for (const [key, value] of Object.entries(row)) out[localKey(key)] = value;
  return out;
}
