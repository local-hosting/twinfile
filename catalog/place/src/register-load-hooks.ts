import { registerPlaceLoadHooks } from '@doppler-group/twinfile-core';

import { checkPlaceArchetype } from './check/place-archetype.js';

registerPlaceLoadHooks({ checkPlaceArchetype });