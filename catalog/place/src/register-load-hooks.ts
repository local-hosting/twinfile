import { registerPlaceLoadHooks } from '@local-hosting/twinfile-core';

import { checkPlaceArchetype } from './check/place-archetype.js';

registerPlaceLoadHooks({ checkPlaceArchetype });