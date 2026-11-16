/**
 * Host pack view — JSON values safe to `pack.set` into a map document.
 * Does not import `loro-crdt` / `loro.js`; hosts own WASM and sync.
 */

const METHOD_FIELD_KEYS = new Set(['methodId', 'method']);

export type TwinfileLoroViewFormat = 'loro';

export type RenderTwinfileLoroViewOptions = {
  /**
   * Drop nested `methodId` / `method` keys (MethodSpec / AXM mount noise).
   * Defaults to `true`.
   */
  stripMethodFields?: boolean;
};

/** Remove empty arrays/objects and undefined so LoroMap pack JSON stays small and diff-friendly. */
export function compactForLoroStorage<T>(value: T): T {
  return compactValue(value) as T;
}

function compactValue(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map(compactValue).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const next = compactValue(raw);
    if (next === undefined) continue;
    if (Array.isArray(next) && next.length === 0) continue;
    if (
      typeof next === 'object' &&
      next !== null &&
      !Array.isArray(next) &&
      Object.keys(next as object).length === 0
    ) {
      continue;
    }
    out[key] = next;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Remove `methodId` / MethodSpec keys before persisting mount / pack JSON. */
export function stripMethodFieldsForLoro<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripMethodFieldsForLoro(entry)) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) {
    if (METHOD_FIELD_KEYS.has(key)) continue;
    out[key] = stripMethodFieldsForLoro(nested);
  }
  return out as T;
}

/**
 * Prepare a JSON-like tree for LoroMap / Trustbase pack storage
 * (optional method-field strip + empty-node compact).
 */
export function prepareTwinfileLoroValue<T>(
  value: T,
  options: RenderTwinfileLoroViewOptions = {},
): T {
  const strip = options.stripMethodFields !== false;
  const prepared = strip ? stripMethodFieldsForLoro(value) : value;
  return compactForLoroStorage(prepared) as T;
}

/**
 * Render a Loro pack view (`loro`).
 * Returns a structured-clone-safe value suitable for `locker.pack(id).set(key, value)`.
 */
export function renderTwinfileLoroView(
  value: unknown,
  format: TwinfileLoroViewFormat = 'loro',
  options: RenderTwinfileLoroViewOptions = {},
): unknown {
  switch (format) {
    case 'loro': {
      const prepared = prepareTwinfileLoroValue(value, options);
      if (prepared === undefined) return undefined;
      return JSON.parse(JSON.stringify(prepared)) as unknown;
    }
    default: {
      const unhandled: never = format;
      throw new Error(`unknown loro view format: ${String(unhandled)}`);
    }
  }
}
