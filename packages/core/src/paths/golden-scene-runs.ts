import { join } from 'node:path';

import { sceneAddress } from '../load/load-scene-run.js';

import { resolveTwinfileRoot } from './catalog-layout.js';

/** Golden scene run id → story example folder that declares it under `story.scenes[]`. */
export const GOLDEN_SCENE_RUN_STORIES: Record<string, string> = {
  'morning-checkpoint': 'airport-operations',
  'terminal-surge': 'airport-operations',
  'terminal-shelter': 'airport-resilience',
  'ashfall-advisory': 'airport-resilience',
  'gate-open-ramp': 'arena-operations',
  'flood-shelter-standup': 'arena-resilience',
  'storm-at-halftime': 'arena-resilience',
  'bowl-quake': 'arena-resilience',
  'bowl-wildfire': 'arena-resilience',
  'pavilion-arrive': 'expo-operations',
  'visitor-surge': 'expo-operations',
  'outdoor-shelter-cap': 'expo-resilience',
  'expo-recovery': 'expo-resilience',
  'hub-disruption': 'mobility-hub-operations',
  'lunch-queue': 'mobility-hub-operations',
  'hub-network-recovery': 'mobility-hub-resilience',
  'dawn-cast-off': 'morning-crossing',
  'harbor-berth': 'morning-crossing',
  'falls-loop': 'falls-day-tour',
  'dunkirk-return': 'falls-day-tour',
  'dunkirk-tsunami': 'harbor-resilience',
  'apron-damage': 'harbor-resilience',
  'meadow-loop': 'park-operations',
  'trailhead-queue': 'park-operations',
  'trailhead-backup': 'park-resilience',
  'slope-watch': 'park-resilience',
  'hall-arrive': 'museum-operations',
  'gallery-queue': 'museum-operations',
  'gallery-shelter-cap': 'museum-resilience',
  'museum-recovery': 'museum-resilience',
  'lobby-arrive': 'aquarium-operations',
  'exhibit-surge': 'aquarium-operations',
  'exhibit-shelter-cap': 'aquarium-resilience',
  'aquarium-recovery': 'aquarium-resilience',
  'pier-queue': 'port-operations',
  'warehouse-transfer': 'port-operations',
  'gangway-backup': 'port-resilience',
  'pier-damage': 'port-resilience',
  'reach-patrol': 'river-operations',
  'eddy-visit': 'river-operations',
  'swim-unsafe-known': 'river-resilience',
  'until-stage-unsafe': 'river-resilience',
  'reach-flood': 'river-resilience',
  'reach-drought': 'river-resilience',
  arrive: 'shop-visit',
  checkout: 'shop-visit',
  'shelter-at-cap': 'shop-resilience',
  'stockroom-outage': 'shop-resilience',
  'hub-queue-spill': 'transit-hub-campus-operations',
  'lunch-flow': 'transit-hub-campus-operations',
  'hub-shelter': 'transit-hub-campus-resilience',
  'hub-recovery': 'transit-hub-campus-resilience',
  'confluence-round': 'watershed-river-operations',
  'school-handoff': 'watershed-river-operations',
  'creek-pollution': 'watershed-river-resilience',
  'quality-exceedance': 'watershed-river-resilience',
  'air-cargo-intake': 'cold-chain-operations',
  'hub-handoff': 'cold-chain-operations',
  'pier-transfer': 'cold-chain-operations',
  'cold-room-outage': 'cold-chain-resilience',
  'apron-storm-hold': 'cold-chain-resilience',
  'pier-field-clearance': 'cold-chain-resilience',
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
