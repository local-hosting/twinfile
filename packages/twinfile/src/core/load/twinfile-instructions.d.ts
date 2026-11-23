import type { LoadedTwinfile } from './load-twinfile.js';
import type { EventBindingDoc, TwinfileInstruction } from '../types/twinfile-instructions.js';
/** Units with ordered `steps:` (manifest field `twinfile: 2` per RFC 0009). */
export declare function isPatchesTwinfile(twinfile: Record<string, unknown>): boolean;
/** Parse `steps:` into ordered compose steps and event binding documents (no filesystem access). */
export declare function parseManifestPatches(twinfile: Record<string, unknown>): {
    instructions: TwinfileInstruction[];
    eventBindings: EventBindingDoc[];
};
/** Ordered build steps for a unit: inline `steps:` or v1 `layers:` files. */
export declare function listTwinfileInstructions(unit: LoadedTwinfile): TwinfileInstruction[];
/** Patch documents only (copies excluded), for row-level inspection. */
export declare function listTwinfilePatchDocs(unit: LoadedTwinfile): Record<string, unknown>[];
/**
 * Event bindings a unit declares. v1 binding files are looked up in the unit, then in `fallbackRoots`
 * (higher-precedence units first), matching the inherit stack.
 */
export declare function listTwinfileEventBindings(unit: LoadedTwinfile, fallbackRoots?: readonly string[]): EventBindingDoc[];
