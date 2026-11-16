import { join } from 'node:path';

import { sceneAddress } from '../load/load-scene-run.js';

import { resolveTwinfileRoot } from './catalog-layout.js';

/** Golden scene run id → story example folder that declares it under `story.scenes[]`. */
export const GOLDEN_SCENE_RUN_STORIES: Record<string, string> = {
  'morning-checkpoint': 'airport-operations',
  'terminal-surge': 'airport-operations',
  'flood-shelter-standup': 'arena-operations',
  'gate-open-ramp': 'arena-operations',
  'storm-at-halftime': 'arena-operations',
  'outdoor-shelter-cap': 'expo-operations',
  'visitor-surge': 'expo-operations',
  'hub-disruption': 'mobility-hub-operations',
  'trailhead-backup': 'park-operations',
  'gangway-backup': 'port-operations',
  'swim-unsafe-known': 'river-operations',
  'until-stage-unsafe': 'river-operations',
  'shelter-at-cap': 'shop-visit',
  'hub-queue-spill': 'transit-hub-campus-operations',
  'lunch-flow': 'transit-hub-campus-operations',
};

function goldenSceneStory(runId: string): string {
  const story = GOLDEN_SCENE_RUN_STORIES[runId];
  if (!story) throw new Error(`unknown golden scene run id: ${runId}`);
  return story;
}

/** `catalog/story/examples/<story>#<scene-id>` relative to the repo root. */
export function goldenSceneRunRelPath(runId: string): string {
  return `catalog/story/examples/${goldenSceneStory(runId)}#${runId}`;
}

/** Absolute scene address (`<story-dir>#<scene-id>`) for a golden run. */
export function resolveGoldenSceneRun(runId: string, projectRoot?: string): string {
  const storyRoot = join(resolveTwinfileRoot(projectRoot), 'catalog/story/examples', goldenSceneStory(runId));
  return sceneAddress(storyRoot, runId);
}
