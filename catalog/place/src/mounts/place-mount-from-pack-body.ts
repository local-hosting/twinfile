import { placeMountFromJson } from '../place/place-mount-json.js';
import type { TwinfilePlaceMount } from '@doppler-group/twinfile-core';

/** Read a place mount from an AXM mount pack body. */
export function placeMountFromAxmMountBody(body: Record<string, unknown>): TwinfilePlaceMount {
  const placeMount = body.placeMount;
  if (placeMount && typeof placeMount === 'object' && !Array.isArray(placeMount)) {
    return placeMountFromJson(placeMount);
  }
  throw new Error('mount body missing placeMount');
}
