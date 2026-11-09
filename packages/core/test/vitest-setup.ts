import { registerPlaceLoadHooks } from '../src/load/place-load-hooks.js';

const { checkPlaceArchetype } = await import('@local-hosting/twinfile-place/check/place-archetype.js');
registerPlaceLoadHooks({ checkPlaceArchetype });
