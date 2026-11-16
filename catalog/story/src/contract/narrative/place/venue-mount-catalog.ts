import type { PlaceMount } from '../types/place-mount.js';

import type { StoryScene } from '../types/scene.js';

export function placeMountByVenueKey(
  placeMounts: readonly PlaceMount[],
): Map<string, PlaceMount> {
  return new Map(placeMounts.map((row) => [row.venueKey, row]));
}

export function resolveSceneSpaceId(
  scene: Pick<StoryScene, 'venueKey' | 'spaceId'>,
  placeMounts?: readonly PlaceMount[],
): string | undefined {
  if (scene.spaceId?.trim()) {
    return scene.spaceId.trim();
  }
  const mount = placeMounts?.find((row) => row.venueKey === scene.venueKey);
  return mount?.defaultSpaceId ?? mount?.spaceIds[0];
}

/** Scene `venueKey` values not present on mounted place units. */
export function findSceneVenueKeysOutsidePlaceMounts(
  scenes: readonly StoryScene[],
  placeMounts: readonly PlaceMount[],
): string[] {
  const available = new Set(placeMounts.map((row) => row.venueKey));
  const stray = new Set<string>();
  for (const scene of scenes) {
    const key = scene.venueKey?.trim();
    if (key && !available.has(key)) {
      stray.add(key);
    }
  }
  return [...stray].sort();
}
