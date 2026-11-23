import { ok } from '../types/twin-error.js';
let checkPlaceArchetypeHook = () => ok({});
export function registerPlaceLoadHooks(hooks) {
    if (hooks.checkPlaceArchetype)
        checkPlaceArchetypeHook = hooks.checkPlaceArchetype;
}
export function checkPlaceArchetypeOnLoad(unit) {
    return checkPlaceArchetypeHook(unit);
}
/** @internal tests */
export function resetPlaceLoadHooksForTests() {
    checkPlaceArchetypeHook = () => ok({});
}
