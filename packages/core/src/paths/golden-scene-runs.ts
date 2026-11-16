import { join } from 'node:path';

import { resolveTwinfileRoot } from './resolve-twinfile-root.js';

/** Canonical golden scene runs (`catalog/story/examples/.../scenes/<id>/run.yaml`). */
export const GOLDEN_SCENE_RUN_RELPATHS: Record<string, string> = {
  'airport-morning-checkpoint':
    'catalog/story/examples/airport-operations/scenes/airport-morning-checkpoint',
  'airport-terminal-surge': 'catalog/story/examples/airport-operations/scenes/airport-terminal-surge',
  'arena-flood-shelter-standup': 'catalog/story/examples/arena-operations/scenes/arena-flood-shelter-standup',
  'arena-gate-open-ramp': 'catalog/story/examples/arena-operations/scenes/arena-gate-open-ramp',
  'arena-storm-at-halftime': 'catalog/story/examples/arena-operations/scenes/arena-storm-at-halftime',
  'expo-outdoor-shelter-cap': 'catalog/story/examples/expo-operations/scenes/expo-outdoor-shelter-cap',
  'expo-visitor-surge': 'catalog/story/examples/expo-operations/scenes/expo-visitor-surge',
  'mobility-hub-hub-disruption': 'catalog/story/examples/mobility-hub-operations/scenes/mobility-hub-hub-disruption',
  'park-trailhead-backup': 'catalog/story/examples/park-operations/scenes/park-trailhead-backup',
  'port-gangway-backup': 'catalog/story/examples/port-operations/scenes/port-gangway-backup',
  'river-swim-unsafe-known': 'catalog/story/examples/river-operations/scenes/river-swim-unsafe-known',
  'river-until-stage-unsafe': 'catalog/story/examples/river-operations/scenes/river-until-stage-unsafe',
  'shop-shelter-at-cap': 'catalog/story/examples/shop-visit/scenes/shop-shelter-at-cap',
  'transit-hub-campus-hub-queue-spill':
    'catalog/story/examples/transit-hub-campus-operations/scenes/transit-hub-campus-hub-queue-spill',
  'transit-hub-campus-lunch-flow':
    'catalog/story/examples/transit-hub-campus-operations/scenes/transit-hub-campus-lunch-flow',
};

export function goldenSceneRunRelPath(runId: string): string {
  const rel = GOLDEN_SCENE_RUN_RELPATHS[runId];
  if (!rel) {
    throw new Error(`unknown golden scene run id: ${runId}`);
  }
  return rel;
}

export function resolveGoldenSceneRunDir(runId: string, projectRoot?: string): string {
  return join(resolveTwinfileRoot(projectRoot), goldenSceneRunRelPath(runId));
}