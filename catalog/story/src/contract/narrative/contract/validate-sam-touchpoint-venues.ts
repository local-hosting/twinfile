import type { SAM } from '../types/sam.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';
import { listSceneTouchpointRefs, touchpointRequiresVenue } from '../touchpoint/resolve-touchpoint-venue.js';

export function validateSAMTouchpointVenues(
  sam: SAM,
  touchpointCatalog?: SAMTouchpointCatalog,
): string[] {
  const scenes = sam.scenes;
  if (!scenes?.length || !touchpointCatalog) {
    return [];
  }

  const venueIds = new Set((sam.venues ?? []).map((row) => row.venueKey));
  const issues: string[] = [];

  for (const scene of scenes) {
    for (const ref of listSceneTouchpointRefs(scene)) {
      if (!touchpointRequiresVenue(ref.id, touchpointCatalog)) {
        continue;
      }

      const catalogRow = touchpointCatalog.touchpoints.find((row) => row.id === ref.id);
      const resolved = ref.venueKey?.trim() || catalogRow?.venueKey?.trim() || scene.venueKey;

      if (!resolved) {
        issues.push(
          `scene ${scene.id} touchpoint ${ref.id} is physical/blended but has no venueKey (scene, ref, or catalog)`,
        );
        continue;
      }

      if (venueIds.size > 0 && !venueIds.has(resolved)) {
        issues.push(
          `scene ${scene.id} touchpoint ${ref.id} venueKey "${resolved}" is not listed on sam.venues`,
        );
      }
    }
  }

  return issues;
}
