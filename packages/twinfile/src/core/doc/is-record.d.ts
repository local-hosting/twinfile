/** Plain YAML/JSON mapping — excludes `null` and arrays. */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
