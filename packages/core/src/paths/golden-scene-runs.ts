import { join } from 'node:path';

import { sceneAddress } from '../load/load-scene-run.js';

import { resolveTwinfileRoot } from './catalog-layout.js';

/** Golden scene run id → story example folder that declares it under `story.scenes[]`. */
export const GOLDEN_SCENE_RUN_STORIES: Record<string, string> = {
  'airport-morning-checkpoint': 'airport-operations',
  'airport-terminal-surge': 'airport-operations',
  'arena-flood-shelter-standup': 'arena-operations',
  'arena-gate-open-ramp': 'arena-operations',
  'arena-storm-at-halftime': 'arena-operations',
  'expo-outdoor-shelter-cap': 'expo-operations',
  'expo-visitor-surge': 'expo-operations',
  'mobility-hub-hub-disruption': 'mobility-hub-operations',
  'park-trailhead-backup': 'park-operations',
  'port-gangway-backup': 'port-operations',
  'river-swim-unsafe-known': 'river-operations',
  'river-until-stage-unsafe': 'river-operations',
  'shop-shelter-at-cap': 'shop-visit',
  'transit-hub-campus-hub-queue-spill': 'transit-hub-campus-operations',
  'transit-hub-campus-lunch-flow': 'transit-hub-campus-operations',
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
