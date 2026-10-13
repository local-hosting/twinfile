import { placeRefIdentity } from '@local-hosting/twinfile/ref';

import type { Story } from '../types/story-narrative.js';
import type { StoryTouchpointCatalog } from '../types/touchpoint-catalog.js';
import { listSceneTouchpointRefs, touchpointRequiresPlace } from '../touchpoint/resolve-touchpoint-place.js';

export function validateStoryNarrativeTouchpointPlaces(
  story: Story,
  touchpointCatalog?: StoryTouchpointCatalog,
): string[] {
  const scenes = story.scenes;
  if (!scenes?.length || !touchpointCatalog) {
    return [];
  }

  const placeIds = new Set((story.places ?? []).map((row) => placeRefIdentity(row.placeRef)));
  const issues: string[] = [];

  for (const scene of scenes) {
    for (const ref of listSceneTouchpointRefs(scene)) {
      if (!touchpointRequiresPlace(ref.id, touchpointCatalog)) {
        continue;
      }

      const catalogRow = touchpointCatalog.touchpoints.find((row) => row.id === ref.id);
      const resolved = ref.placeRef?.trim() || catalogRow?.placeRef?.trim() || scene.placeRef;

      if (!resolved) {
        issues.push(
          `scene ${scene.id} touchpoint ${ref.id} is physical/blended but has no placeRef (scene, ref, or catalog)`,
        );
        continue;
      }

      if (placeIds.size > 0 && !placeIds.has(placeRefIdentity(resolved))) {
        issues.push(
          `scene ${scene.id} touchpoint ${ref.id} placeRef "${resolved}" is not listed on story.places`,
        );
      }
    }
  }

  return issues;
}
