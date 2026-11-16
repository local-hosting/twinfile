import { join } from 'node:path';

import { sceneAddress } from '../load/load-scene-run.js';

import { resolveTwinfileRoot } from './catalog-layout.js';

/** Golden scene run id → story example folder that declares it under `story.scenes[]`. */
export const GOLDEN_SCENE_RUN_STORIES: Record<string, string> = {
  'morning-checkpoint': 'airport-operations',
  'terminal-surge': 'airport-operations',
  'terminal-shelter': 'airport-resilience',
  'post-hazard-recovery': 'airport-resilience',
  'gate-open-ramp': 'arena-operations',
  'flood-shelter-standup': 'arena-resilience',
  'storm-at-halftime': 'arena-resilience',
  'pavilion-arrive': 'expo-operations',
  'visitor-surge': 'expo-operations',
  'outdoor-shelter-cap': 'expo-resilience',
  'hub-disruption': 'mobility-hub-operations',
  'lunch-queue': 'mobility-hub-operations',
  'dawn-cast-off': 'morning-crossing',
  'harbor-berth': 'morning-crossing',
  'falls-loop': 'falls-day-tour',
  'dunkirk-return': 'falls-day-tour',
  'slip-litter': 'harbor-resilience',
  'apron-damage': 'harbor-resilience',
  'meadow-loop': 'park-operations',
  'trailhead-arrive': 'park-operations',
  'trailhead-backup': 'park-resilience',
  'boardwalk-damage': 'park-resilience',
  'pier-arrival': 'port-operations',
  'warehouse-transfer': 'port-operations',
  'gangway-backup': 'port-resilience',
  'pier-damage': 'port-resilience',
  'swim-unsafe-known': 'river-resilience',
  'until-stage-unsafe': 'river-resilience',
  arrive: 'shop-visit',
  checkout: 'shop-visit',
  'shelter-at-cap': 'shop-resilience',
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
