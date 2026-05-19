import { placeRowMatchesUseMode } from '../place/place-use-mode.js';
import type { TwinfileUseMode } from '@local-hosting/twinfile-core';

export type PlaceQueryInput = {
  collection?: string;
  id?: string;
  role?: string;
  /** When set, drop rows whose `roles[]` tags belong only to the other mode. */
  mode?: TwinfileUseMode;
  level?: string;
  kind?: string;
  /** Visit beat kind (`visits` collection) or space/route kind elsewhere. */
  space?: string;
  /** Match `row.ext[extKey]`; when `extValue` is set, require strict equality. */
  extKey?: string;
  extValue?: string | number | boolean;
  limit?: number;
};

export type PlaceQueryRow = Record<string, unknown> & { id: string };

export function queryPlace(
  place: Record<string, unknown>,
  input: PlaceQueryInput,
): PlaceQueryRow[] {
  const collection = input.collection ?? 'spaces';
  const rows = place[collection];
  if (!Array.isArray(rows)) return [];

  let out = (rows as PlaceQueryRow[]).filter((r) => r && typeof r.id === 'string');
  if (input.id) out = out.filter((r) => r.id === input.id);
  if (input.role) out = out.filter((r) => Array.isArray(r.roles) && r.roles.includes(input.role));
  if (input.mode) out = out.filter((r) => placeRowMatchesUseMode(r, input.mode!));
  if (input.level) out = out.filter((r) => r.level === input.level);
  if (input.kind) out = out.filter((r) => r.kind === input.kind);
  if (input.space) out = out.filter((r) => r.space === input.space);
  if (input.extKey) {
    out = out.filter((r) => {
      const ext = r.ext as Record<string, unknown> | undefined;
      if (!ext || !(input.extKey! in ext)) return false;
      if (input.extValue !== undefined) return ext[input.extKey!] === input.extValue;
      return true;
    });
  }
  if (input.limit !== undefined) out = out.slice(0, input.limit);
  return out;
}

export function explainField(
  place: Record<string, unknown>,
  collection: string,
  id: string,
  field?: string,
): { collection: string; id: string; field?: string; value: unknown } | undefined {
  const rows = place[collection];
  if (!Array.isArray(rows)) return undefined;
  const row = (rows as PlaceQueryRow[]).find((r) => r.id === id);
  if (!row) return undefined;
  if (field === undefined) return { collection, id, value: row };
  return { collection, id, field, value: row[field] };
}
