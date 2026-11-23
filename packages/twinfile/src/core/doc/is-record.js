/** Plain YAML/JSON mapping — excludes `null` and arrays. */
export function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
