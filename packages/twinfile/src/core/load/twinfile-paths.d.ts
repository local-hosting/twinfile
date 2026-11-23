export type LayerMergeMode = 'patch' | 'replace';
export type ManifestLayerEntry = {
    path: string;
    mode: LayerMergeMode;
};
/** Parse one manifest `layers:` item (string path or `{ path, mode? }`). */
export declare function parseManifestLayerEntry(item: unknown): ManifestLayerEntry | undefined;
export declare function parseManifestLayerEntries(twinfile: Record<string, unknown>): ManifestLayerEntry[];
export declare function isBindingLayerPath(rel: string): boolean;
/** Place graph layer files (excludes event binding files under `bindings/`). */
export declare function twinfilePlaceLayerPaths(twinfile: Record<string, unknown>): ManifestLayerEntry[];
/** Place layer paths only (patch mode entries as strings). */
export declare function twinfileLayerPaths(twinfile: Record<string, unknown>): string[];
/** Binding file paths: `bindings/*` entries in `layers:`. */
export declare function twinfileBindingPaths(twinfile: Record<string, unknown>): string[];
/** Full authoring stack (place + binding paths) for editor and `twin fmt`. */
export declare function twinfileStackPaths(twinfile: Record<string, unknown>): string[];
/** Scenario stack refs: v1 `include:`, or `steps[].copy` of published units (RFC 0009). */
export declare function manifestScenarioComposeRefs(twinfile: Record<string, unknown>): string[];
