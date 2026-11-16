import { placeRefForName } from '@doppler-group/twinfile-core/ref';
import type { PlaceRef } from '@doppler-group/twinfile-character/persona/journey/place.schema.js';
import type { PlaceMount } from '../types/place-mount.js';

import { minimalPlaceMount } from './minimal-place-mount.js';

/** Map Character {@link PlaceRef} to a Story/AXM place mount (synthesized `twinfile/place/{id}:0.0.0` without a published unit). */
export function placeMountFromPlaceRef(ref: PlaceRef): PlaceMount {
  const mount = minimalPlaceMount({
    placeRef: ref.placeRef ?? placeRefForName(ref.id),
    title: ref.label?.trim() || ref.id,
    lat: ref.lat,
    lon: ref.lon,
  });
  const geotype = ref.role?.trim() || ref.geotypeSlug?.trim();
  return geotype ? { ...mount, geotypePrimary: geotype } : mount;
}
