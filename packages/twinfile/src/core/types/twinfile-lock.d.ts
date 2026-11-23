/** Parsed `<unit>.twin.lock` (see spec `twinfile/lock.schema.json`). */
export type TwinfileLockRefEntry = {
    version: string;
    manifest?: string;
    tree?: string;
    layers?: string[];
};
export type TwinfileLockDocument = {
    twinfile: 1;
    refs: Record<string, TwinfileLockRefEntry>;
    meta?: {
        overridden?: boolean;
    };
};
/** Unit lock suffix: `<unit>/<unit>.twin.lock`. */
export declare const TWIN_LOCK_SUFFIX = ".twin.lock";
export declare function lockRefKeyFromTwinfile(twinfile: Record<string, unknown>): string;
