export type GkPointClickDetail = {
  features?: Array<{
    id?: string | number;
    properties?: Record<string, unknown>;
  }>;
};

/** Resolve twin site id from a gk-point-click detail. */
export function siteIdFromGkPointClick(detail: GkPointClickDetail): string | undefined {
  const feature = detail.features?.[0];
  if (!feature) return undefined;
  const props = feature.properties ?? {};
  const raw = props['point-id'] ?? props.id ?? feature.id;
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (typeof raw === 'number') return String(raw);
  return undefined;
}
