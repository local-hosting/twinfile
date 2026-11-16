export type IdRecord = { id: string; $delete?: true; [key: string]: unknown };

export type MergePatch = Record<string, unknown>;

/** RFC 8785-style canonical JSON string (sorted object keys, no whitespace). */
export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`).join(',')}}`;
}

function mergeIdArray(base: IdRecord[], patch: IdRecord[]): IdRecord[] {
  const byId = new Map<string, IdRecord>();
  for (const row of base) {
    byId.set(row.id, { ...row });
  }
  const order = base.map((r) => r.id);
  for (const row of patch) {
    if (row.$delete) {
      byId.delete(row.id);
      const idx = order.indexOf(row.id);
      if (idx >= 0) order.splice(idx, 1);
      continue;
    }
    const prev = byId.get(row.id);
    if (prev) {
      byId.set(row.id, mergeObjects(prev, row) as IdRecord);
    } else {
      byId.set(row.id, { ...row });
      order.push(row.id);
    }
  }
  return order.map((id) => byId.get(id)!);
}

function isIdArray(value: unknown): value is IdRecord[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => typeof row === 'object' && row !== null && 'id' in row)
  );
}

export type MergeOptions = { mode?: 'patch' | 'replace' };

function stripDeleteRows(rows: IdRecord[]): IdRecord[] {
  return rows
    .filter((row) => !row.$delete)
    .map((row) => {
      const { $delete: _d, ...rest } = row;
      return rest as IdRecord;
    });
}

function isIdArrayLoose(value: unknown): value is IdRecord[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 || value.every((row) => typeof row === 'object' && row !== null && 'id' in row))
  );
}

/** Merge patch into target (RFC 7396 objects; id-arrays by id). `replace` overwrites each key in patch (Docker COPY). */
export function mergeObjects(target: unknown, patch: unknown, options: MergeOptions = {}): unknown {
  if (patch === null) return null;
  if (typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }
  if (typeof target !== 'object' || target === null || Array.isArray(target)) {
    return mergeObjects({}, patch, options);
  }
  const out: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  const replace = options.mode === 'replace';
  for (const [key, val] of Object.entries(patch as Record<string, unknown>)) {
    if (replace) {
      if (val === null) {
        delete out[key];
        continue;
      }
      if (isIdArrayLoose(val)) {
        out[key] = stripDeleteRows(val);
        continue;
      }
      if (typeof val === 'object' && !Array.isArray(val)) {
        out[key] = mergeObjects({}, val, { mode: 'replace' });
        continue;
      }
      out[key] = val;
      continue;
    }
    if (val === null) {
      delete out[key];
      continue;
    }
    const cur = out[key];
    if (isIdArray(val) && isIdArray(cur)) {
      out[key] = mergeIdArray(cur, val);
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      out[key] = mergeObjects(cur ?? {}, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}
