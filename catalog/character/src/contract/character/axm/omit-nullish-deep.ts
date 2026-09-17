/**
 * Drop `null` / `undefined` from JSON-like trees (JSON/CRDT round-trips often materialize
 * omitted optional fields as `null`, which Zod optional fields reject).
 */
export function omitNullishDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => omitNullishDeep(item)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child === null || child === undefined) {
        continue;
      }
      out[key] = omitNullishDeep(child);
    }
    return out as T;
  }
  return value;
}
