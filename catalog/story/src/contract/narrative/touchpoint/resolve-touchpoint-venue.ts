import type { PlaceMount } from '../types/place-mount.js';
import type { StoryScene, StorySceneTouchpointRef } from '../types/scene.js';
import type { SAMTouchpointCatalog, SAMTouchpointLocus } from '../types/touchpoint-catalog.js';
import { resolveSceneSpaceId } from '../place/venue-mount-catalog.js';

const PHYSICAL_LOCI: readonly SAMTouchpointLocus[] = ['physical', 'blended'];

export function listSceneTouchpointRefs(scene: StoryScene): StorySceneTouchpointRef[] {
  if (scene.touchpoints?.length) {
    return scene.touchpoints;
  }
  return (scene.touchpointIds ?? []).map((id) => ({ id }));
}

export function resolveTouchpointDefinition(
  touchpointId: string,
  catalog?: SAMTouchpointCatalog,
) {
  return catalog?.touchpoints.find((row) => row.id === touchpointId);
}

/**
 * Venue for a touchpoint in a scene: scene ref → catalog default → scene setting.
 * Physical/blended touchpoints should resolve to a mounted `venueKey`.
 */
export function resolveTouchpointVenueAtScene(input: {
  touchpointId: string;
  scene: StoryScene;
  touchpointCatalog?: SAMTouchpointCatalog;
  placeMounts?: readonly PlaceMount[];
  sceneRef?: StorySceneTouchpointRef;
}): { venueKey: string; spaceId?: string } {
  const ref = input.sceneRef ?? input.scene.touchpoints?.find((row) => row.id === input.touchpointId);
  const definition = resolveTouchpointDefinition(input.touchpointId, input.touchpointCatalog);

  const venueKey =
    ref?.venueKey?.trim() ||
    definition?.venueKey?.trim() ||
    input.scene.venueKey;

  const spaceId =
    ref?.spaceId?.trim() ||
    definition?.spaceId?.trim() ||
    resolveSceneSpaceId(input.scene, input.placeMounts);

  return { venueKey, spaceId };
}

export function touchpointRequiresVenue(
  touchpointId: string,
  catalog?: SAMTouchpointCatalog,
): boolean {
  const definition = resolveTouchpointDefinition(touchpointId, catalog);
  if (!definition?.locus) {
    return false;
  }
  return PHYSICAL_LOCI.includes(definition.locus);
}
