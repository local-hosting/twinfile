import type { LoadedTwinfile } from './load-twinfile.js';
/** A spatial twin — the only role allowed on a place head. */
export declare const TWINFILE_UNIT_ROLE: "place";
/** Story scene run — compose head built from `story.scenes[].run`. */
export declare const RUN_PRESET_ROLE: "run";
export declare function isRunUnit(loaded: Pick<LoadedTwinfile, 'scene'>): boolean;
export declare function isPlaceTwinfileUnit(loaded: Pick<LoadedTwinfile, 'scene'>): boolean;
/** Run compose head: `from` / `steps` with `copy:` but not a place Twinfile. */
export declare function isRunComposeHead(doc: Record<string, unknown>): boolean;
