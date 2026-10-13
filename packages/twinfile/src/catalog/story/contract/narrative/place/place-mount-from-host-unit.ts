import type { PlaceMount } from '../types/place-mount.js';

import { placeMountFromJson } from './place-mount-json.js';

/**
 * Accept a host-resolved place unit wire (e.g. from an external open-stack resolver) and return
 * a {@link PlaceMount} keyed by its `placeRef`.
 */
export function placeMountFromHostUnit(input: unknown): PlaceMount {
  return placeMountFromJson(input);
}
