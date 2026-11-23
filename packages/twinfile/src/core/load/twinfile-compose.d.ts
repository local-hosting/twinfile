/** Twinfile 2 Dockerfile steps (`steps:`). Legacy `patches:` / `instructions:` normalize via `twin fmt`. */
export declare function twinfileStepItems(twinfile: Record<string, unknown>): unknown[];
export declare function setTwinfileStepItems(twinfile: Record<string, unknown>, items: unknown[]): void;
/** v2 units: canonical key is `steps:`. */
export declare function normalizeComposeTwinfileKeys(twinfile: Record<string, unknown>): Record<string, unknown>;
