import { join } from 'node:path';

import type { LoadedTwinfile } from '@local-hosting/twinfile-core';

import type { PlaceEvent } from '../types/place-event.js';

import { placeEventToHead } from './place-event-head.js';

/** LoadedTwinfile-shaped row for compose when the event lives in the TS catalog only. */
export function loadedTwinfileFromPlaceEvent(event: PlaceEvent, ref: string): LoadedTwinfile {
  const head = placeEventToHead(event);
  return {
    root: join('catalog:', event.id),
    twinfilePath: ref,
    twinfile: head,
  };
}
