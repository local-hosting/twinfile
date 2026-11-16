import { registerPlaceLoadHooks } from '../src/load/place-load-hooks.js';

const { checkPlaceArchetype } = await import('@doppler-group/twinfile-place/check/place-archetype.js');
registerPlaceLoadHooks({ checkPlaceArchetype });
