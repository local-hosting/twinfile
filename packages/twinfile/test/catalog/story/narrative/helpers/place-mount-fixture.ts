import type { PlaceMount } from '../../../../../src/contract/narrative/types/place-mount.js';

/** Minimal place mounts for unit tests (production uses {@link resolvePlaceMounts} from hosts). */
export function placeMountFixture(input: {
  placeRef: string;
  title: string;
  spaceIds: readonly string[];
  defaultSpaceId?: string;
}): PlaceMount {
  return {
    placeRef: input.placeRef,
    title: input.title,
    spaceIds: input.spaceIds,
    defaultSpaceId: input.defaultSpaceId ?? input.spaceIds[0],
  };
}
