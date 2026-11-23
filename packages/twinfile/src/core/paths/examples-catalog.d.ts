/** Catalog root: twin.local.yaml and/or top-level place unit folders. */
export declare function isExamplesCatalogRoot(dir: string): boolean;
/** Top-level publishable unit folder names under a flat catalog root. */
export declare function listFlatExampleUnitNames(catalogRoot: string): string[];
export declare function flatExampleUnitDir(catalogRoot: string, slug: string): string;
