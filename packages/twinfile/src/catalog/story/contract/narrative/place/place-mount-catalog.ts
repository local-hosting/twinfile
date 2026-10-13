import { placeRefIdentity, samePlaceRef } from '@local-hosting/twinfile/ref';

import type { PlaceMount } from '../types/place-mount.js';

import type { StoryScene } from '../types/scene.js';

/** Mounts keyed by {@link placeRefIdentity} (`{kind}/{name}`), so lookups ignore tags. */
export function placeMountByPlaceRef(placeMounts: readonly PlaceMount[]): Map<string, PlaceMount> {
  return new Map(placeMounts.map((row) => [placeRefIdentity(row.placeRef) ?? row.placeRef, row]));
}

export function resolveSceneSpaceId(
  scene: Pick<StoryScene, 'placeRef' | 'spaceId'>,
  placeMounts?: readonly PlaceMount[],
): string | undefined {
  if (scene.spaceId?.trim()) {
    return scene.spaceId.trim();
  }
  const mount = placeMounts?.find((row) => samePlaceRef(row.placeRef, scene.placeRef));
  return mount?.defaultSpaceId ?? mount?.spaceIds[0];
}

/** Scene `placeRef` values whose place (kind + name) is not mounted. */
export function findScenePlaceRefsOutsidePlaceMounts(
  scenes: readonly StoryScene[],
  placeMounts: readonly PlaceMount[],
): string[] {
  const stray = new Set<string>();
  for (const scene of scenes) {
    const ref = scene.placeRef?.trim();
    if (ref && !placeMounts.some((row) => samePlaceRef(row.placeRef, ref))) {
      stray.add(ref);
    }
  }
  return [...stray].sort();
}
