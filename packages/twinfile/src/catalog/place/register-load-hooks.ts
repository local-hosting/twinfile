import { registerPlaceLoadHooks } from '@local-hosting/twinfile';

import { checkPlaceArchetype } from './check/place-archetype.js';

registerPlaceLoadHooks({ checkPlaceArchetype });