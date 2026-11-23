import type { LoadedTwinfile } from './load-twinfile.js';
import type { Result } from '../types/twin-error.js';
export type PlaceArchetypeLoadCheck = (unit: LoadedTwinfile) => Result<{
    archetype?: string;
}>;
export declare function registerPlaceLoadHooks(hooks: {
    checkPlaceArchetype?: PlaceArchetypeLoadCheck;
}): void;
export declare function checkPlaceArchetypeOnLoad(unit: LoadedTwinfile): ReturnType<PlaceArchetypeLoadCheck>;
/** @internal tests */
export declare function resetPlaceLoadHooksForTests(): void;
