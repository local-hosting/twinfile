export type IdRecord = {
    id: string;
    $delete?: true;
    [key: string]: unknown;
};
export type MergePatch = Record<string, unknown>;
/** RFC 8785-style canonical JSON string (sorted object keys, no whitespace). */
export declare function canonicalizeJson(value: unknown): string;
export type MergeOptions = {
    mode?: 'patch' | 'replace';
};
/** Merge patch into target (RFC 7396 objects; id-arrays by id). `replace` overwrites each key in patch (Docker COPY). */
export declare function mergeObjects(target: unknown, patch: unknown, options?: MergeOptions): unknown;
