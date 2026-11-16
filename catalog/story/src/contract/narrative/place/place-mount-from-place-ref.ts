import type { PlaceRef } from '@doppler-group/twinfile-character/pcm/journey/place.schema.js';
import type { PlaceMount } from '../types/place-mount.js';

import { minimalPlaceMount } from './minimal-place-mount.js';

function venueKeyFromPlaceRef(ref: PlaceRef): string {
  const fromVenueId = ref.venueId?.trim();
  if (fromVenueId) {
    return fromVenueId.startsWith('venue:') ? fromVenueId : `venue:${fromVenueId}`;
  }
  const id = ref.id.trim();
  return id.startsWith('venue:') ? id : `venue:${id}`;
}

/** Map PCM {@link PlaceRef} to a SAM/AXM place mount. */
export function placeMountFromPlaceRef(ref: PlaceRef): PlaceMount {
  const mount = minimalPlaceMount({
    venueKey: venueKeyFromPlaceRef(ref),
    title: ref.label?.trim() || ref.id,
    lat: ref.lat,
    lon: ref.lon,
  });
  const geotype = ref.role?.trim() || ref.geotypeSlug?.trim();
  return geotype ? { ...mount, geotypePrimary: geotype } : mount;
}
