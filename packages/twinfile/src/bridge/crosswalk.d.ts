export type CrosswalkRow = {
    source: string;
    term: string;
    collection?: string;
    field?: string;
    ext?: boolean;
    values?: Record<string, string>;
};
export declare function crosswalkPath(): string;
export declare function loadCrosswalk(): CrosswalkRow[];
export declare function clearCrosswalkCacheForTests(): void;
export declare function crosswalkRows(source: string, term: string): CrosswalkRow[];
/** Mapped Twinfile value for a closed list. Missing keys fail. */
export declare function crosswalkValue(source: string, term: string, collection: string, field: string, raw: string): string;
/** Role or other optional value. Absent keys mean no tag. */
export declare function optionalCrosswalkValue(source: string, term: string, collection: string, field: string, raw: string): string | undefined;
/**
 * Leftover source fields. A term mapped onto this collection's field must already
 * have been stored there. `ext: true` and unknown terms stay in ext.
 */
export declare function unmappedExt(source: string, collection: string, props: Record<string, unknown>, consumed: string[]): Record<string, unknown>;
/** A mapped term must not be sitting in ext on the collection that owns it. */
export declare function assertCrosswalkPlacement(source: string, document: unknown): void;
