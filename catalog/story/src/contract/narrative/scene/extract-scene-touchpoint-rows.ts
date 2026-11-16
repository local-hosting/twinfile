import type { SceneEmotions, StoryScene } from '../types/scene.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';
import type { PlaceMount } from '../types/place-mount.js';
import {
  listSceneTouchpointRefs,
  resolveTouchpointPlaceAtScene,
} from '../touchpoint/resolve-touchpoint-place.js';

export type SceneTouchpointRow = {
  sceneId: string;
  order: number;
  placeRef: string;
  spaceId?: string;
  visitMomentId?: string;
  characterIds: readonly string[];
  touchpointId: string;
  actId?: string;
  jobIds?: string[];
  emotions?: SceneEmotions;
};

function orderedScenes(scenes: readonly StoryScene[]): StoryScene[] {
  return [...scenes].sort((left, right) => left.order - right.order);
}

/** Flatten storyboard scenes to touchpoint rows with per-scene place (and optional space) context. */
export function extractSceneTouchpointRows(
  scenes: readonly StoryScene[],
  options?: {
    placeMounts?: readonly PlaceMount[];
    touchpointCatalog?: SAMTouchpointCatalog;
  },
): SceneTouchpointRow[] {
  const rows: SceneTouchpointRow[] = [];
  const seen = new Set<string>();

  for (const scene of orderedScenes(scenes)) {
    for (const ref of listSceneTouchpointRefs(scene)) {
      const id = ref.id.trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      const place = resolveTouchpointPlaceAtScene({
        touchpointId: id,
        scene,
        sceneRef: ref,
        touchpointCatalog: options?.touchpointCatalog,
        placeMounts: options?.placeMounts,
      });
      rows.push({
        sceneId: scene.id,
        order: scene.order,
        placeRef: place.placeRef,
        spaceId: place.spaceId,
        visitMomentId: scene.visitMomentId,
        characterIds: scene.characterIds,
        touchpointId: id,
        actId: scene.actId,
        jobIds: scene.jobIds,
        emotions: scene.emotions,
      });
    }
  }

  return rows;
}
