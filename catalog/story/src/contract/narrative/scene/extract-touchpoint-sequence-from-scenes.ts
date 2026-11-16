import type { StoryScene } from '../types/scene.js';
import { listSceneTouchpointRefs } from '../touchpoint/resolve-touchpoint-venue.js';

function orderedScenes(scenes: readonly StoryScene[]): StoryScene[] {
  return [...scenes].sort((left, right) => left.order - right.order);
}

/** Walk storyboard scenes in order; dedupe touchpoint ids. */
export function extractTouchpointSequenceFromScenes(scenes: readonly StoryScene[]): string[] {
  const seen = new Set<string>();
  const sequence: string[] = [];

  for (const scene of orderedScenes(scenes)) {
    for (const ref of listSceneTouchpointRefs(scene)) {
      const id = ref.id.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      sequence.push(id);
    }
  }

  return sequence;
}
