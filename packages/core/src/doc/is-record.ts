/** Plain YAML/JSON mapping — excludes `null` and arrays. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
