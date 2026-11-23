/**
 * Monorepo folder for the **twin types** (place, resource, character, context, story, event).
 * The **simulator** package is not under this hub — it plays these catalogs at runtime.
 *
 * Every catalog path derives from the monorepo root; `TF_TWINFILE_ROOT` is the only override.
 */
/** Legacy repo folder name; published package uses `src/catalog/<type>`. */
export declare const TWIN_CATALOG_HUB: "catalog";
export declare const TWIN_CATALOG_TYPES: readonly ["place", "resource", "character", "context", "story", "event"];
export type TwinCatalogType = (typeof TWIN_CATALOG_TYPES)[number];
export declare function catalogHubDir(twinfileRoot: string): string;
export declare function catalogTypeDir(twinfileRoot: string, type: TwinCatalogType): string;
export declare function catalogTypeExamplesDir(twinfileRoot: string, type: TwinCatalogType): string;
/** Character/situations YAML libraries (`libs/audience|journey|psychology/`) — not twin heads. */
export declare function catalogCharacterLibsDir(twinfileRoot: string): string;
export declare function isTwinfileMonorepoRoot(dir: string): boolean;
/** Monorepo root: `TF_TWINFILE_ROOT`, else walk up from `seed`, else from this package. */
export declare function resolveTwinfileRoot(seed?: string): string;
/** Golden twin units for a kind (`catalog/<type>/examples`). */
export declare function resolveTypeExamplesRoot(type: TwinCatalogType, root?: string): string;
/** Place golden catalog (`catalog/place/examples`). */
export declare function resolvePlaceExamplesCatalogRoot(root?: string): string;
/** Character Character/situations YAML under `catalog/character/libs/`. */
export declare function resolveCharacterCatalogRoot(seed?: string): string;
