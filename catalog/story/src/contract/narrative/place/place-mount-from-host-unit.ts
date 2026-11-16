import type { PlaceMount } from '../types/place-mount.js';

import { placeMountFromJson } from './place-mount-json.js';

/**
 * Accept a host-resolved place unit wire (e.g. from an external open-stack resolver) and return
 * a Productgrade {@link PlaceMount}. Strips catalog `placeRef` when present.
 */
export function placeMountFromHostUnit(input: unknown): PlaceMount {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return placeMountFromJson(input);
  }
  const record = input as Record<string, unknown>;
  const { placeRef: _placeRef, ...rest } = record;
  return placeMountFromJson(rest);
}
