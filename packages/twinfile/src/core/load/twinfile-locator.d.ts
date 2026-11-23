/** Head file name for a unit folder: `river` → `river.twin.yaml`. */
export declare function twinHeadFileName(unitDir: string): string;
/** Head path for a unit folder, whether or not it exists. */
export declare function twinHeadPath(unitDir: string): string;
/** Lock file name for a unit folder: `river` → `river.twin.lock`. */
export declare function twinLockFileName(unitDir: string): string;
/** Lock path for a unit folder, whether or not it exists. */
export declare function twinLockPath(unitDir: string): string;
/** Resolve the unit head in `root`, if present. */
export declare function findTwinfileYamlPath(root: string): string | undefined;
