import type { LoadedTwinfile } from './load-twinfile.js';
import type { Result } from '../types/twin-error.js';
import { ok } from '../types/twin-error.js';

export type PlaceArchetypeLoadCheck = (unit: LoadedTwinfile) => Result<{ archetype?: string }>;

let checkPlaceArchetypeHook: PlaceArchetypeLoadCheck = () => ok({});

export function registerPlaceLoadHooks(hooks: { checkPlaceArchetype?: PlaceArchetypeLoadCheck }): void {
  if (hooks.checkPlaceArchetype) checkPlaceArchetypeHook = hooks.checkPlaceArchetype;
}

export function checkPlaceArchetypeOnLoad(unit: LoadedTwinfile): ReturnType<PlaceArchetypeLoadCheck> {
  return checkPlaceArchetypeHook(unit);
}

/** @internal tests */
export function resetPlaceLoadHooksForTests(): void {
  checkPlaceArchetypeHook = () => ok({});
}