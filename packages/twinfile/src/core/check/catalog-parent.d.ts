import type { TwinError } from '../types/twin-error.js';
/** Semantic checks for optional `catalog.parent` on scenario and event units. */
export declare function checkCatalogParent(unitRoot: string, twinfile: Record<string, unknown>): TwinError[];
