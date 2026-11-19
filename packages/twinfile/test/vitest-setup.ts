import { registerPlaceLoadHooks } from '@local-hosting/twinfile'
import { checkPlaceArchetype } from '@local-hosting/twinfile/place/check/place-archetype.js'

registerPlaceLoadHooks({ checkPlaceArchetype })