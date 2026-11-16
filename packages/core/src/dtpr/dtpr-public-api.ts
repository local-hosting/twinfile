/** Default pinned schema for badge icons (override with `TF_DTPR_SCHEMA` or inline `dtpr.schema`). */
export const DEFAULT_DTPR_SCHEMA_VERSION = 'dtpr@2026-09-01-beta';

const DTPR_ELEMENT_ID = /^[a-z0-9_]+$/;

export function dtprApiBaseUrl(): string {
  const base = process.env.TF_DTPR_API_BASE?.trim();
  if (base) return base.replace(/\/$/, '');
  return 'https://api.dtpr.io/api/v2';
}

export function resolveDtprSchemaVersion(inlineSchema?: string): string {
  const fromEnv = process.env.TF_DTPR_SCHEMA?.trim();
  if (fromEnv) return fromEnv;
  if (inlineSchema?.trim()) return inlineSchema.trim();
  return DEFAULT_DTPR_SCHEMA_VERSION;
}

export function dtprElementIconUrl(schemaVersion: string, elementId: string): string | null {
  if (!DTPR_ELEMENT_ID.test(elementId)) return null;
  const version = encodeURIComponent(schemaVersion);
  const id = encodeURIComponent(elementId);
  return `${dtprApiBaseUrl()}/schemas/${version}/elements/${id}/icon.svg`;
}

export function flattenInlineElementIds(elements: Record<string, readonly string[]>): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const ids of Object.values(elements)) {
    if (!Array.isArray(ids)) continue;
    for (const raw of ids) {
      const id = String(raw);
      if (!DTPR_ELEMENT_ID.test(id) || seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
  }
  return ordered;
}

/** Readable label when API titles are unavailable (never show raw `snake_case` ids). */
export function humanizeDtprElementId(elementId: string): string {
  return elementId
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type LocaleTitle = { locale?: string; value?: string };

function pickLocaleTitle(titles: LocaleTitle[] | undefined, locale: string): string | null {
  if (!Array.isArray(titles) || titles.length === 0) return null;
  const exact = titles.find((row) => row.locale === locale);
  const value = exact?.value ?? titles[0]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const titleCache = new Map<string, string>();

export async function fetchDtprElementTitle(
  schemaVersion: string,
  elementId: string,
  locale = 'en',
): Promise<string | null> {
  if (!DTPR_ELEMENT_ID.test(elementId)) return null;
  const cacheKey = `${schemaVersion}:${elementId}:${locale}`;
  const cached = titleCache.get(cacheKey);
  if (cached) return cached;

  const url = `${dtprApiBaseUrl()}/schemas/${encodeURIComponent(schemaVersion)}/elements/${encodeURIComponent(elementId)}`;
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const body = (await res.json()) as { element?: { title?: LocaleTitle[] } };
    const title = pickLocaleTitle(body.element?.title, locale);
    if (title) {
      titleCache.set(cacheKey, title);
      return title;
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchDtprElementLabels(
  schemaVersion: string,
  elementIds: readonly string[],
  locale = 'en',
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  await Promise.all(
    elementIds.map(async (id) => {
      const title = await fetchDtprElementTitle(schemaVersion, id, locale);
      labels.set(id, title ?? humanizeDtprElementId(id));
    }),
  );
  return labels;
}

export type InlineDtprElements = {
  schema?: string;
  elements?: Record<string, readonly string[]>;
};

export function inlineDtprElements(dtpr: unknown): InlineDtprElements | null {
  if (typeof dtpr !== 'object' || dtpr === null || !('elements' in dtpr)) return null;
  const row = dtpr as InlineDtprElements;
  if (!row.elements || typeof row.elements !== 'object') return null;
  return row;
}

export function labelCacheKey(schemaVersion: string, elementId: string): string {
  return `${schemaVersion}\0${elementId}`;
}

export async function fetchDtprLabelsForDisclosures(
  disclosures: readonly { dtpr: unknown }[],
  locale = 'en',
): Promise<Map<string, string>> {
  const idsBySchema = new Map<string, Set<string>>();
  for (const row of disclosures) {
    const inline = inlineDtprElements(row.dtpr);
    if (!inline?.elements) continue;
    const schema = resolveDtprSchemaVersion(inline.schema);
    let set = idsBySchema.get(schema);
    if (!set) {
      set = new Set();
      idsBySchema.set(schema, set);
    }
    for (const id of flattenInlineElementIds(inline.elements)) {
      set.add(id);
    }
  }

  const cache = new Map<string, string>();
  for (const [schema, ids] of idsBySchema) {
    const labels = await fetchDtprElementLabels(schema, [...ids], locale);
    for (const [id, label] of labels) {
      cache.set(labelCacheKey(schema, id), label);
    }
  }
  return cache;
}

export function elementLabelsForInlineDtpr(
  dtpr: unknown,
  labelCache: ReadonlyMap<string, string>,
): Map<string, string> | undefined {
  const inline = inlineDtprElements(dtpr);
  if (!inline?.elements) return undefined;
  const schema = resolveDtprSchemaVersion(inline.schema);
  const map = new Map<string, string>();
  for (const id of flattenInlineElementIds(inline.elements)) {
    map.set(id, labelCache.get(labelCacheKey(schema, id)) ?? humanizeDtprElementId(id));
  }
  return map;
}
