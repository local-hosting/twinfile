import { describe, expect, it } from 'vitest';
import { planStoryCreateHeuristic } from '../../../src/contract/narrative/story-plan/plan-catalog-heuristic.js';
import type { SamStoryPlanCatalogSnapshotV1 } from '../../../src/contract/narrative/types/story-plan-catalog.js';
import {
  createStoryPlanChance,
  resolveStoryPlanRandom,
  storyPlanRandomFromChance,
} from '../../../src/contract/narrative/story-plan/rng.js';
import { pickRandomFrom } from '../../../src/contract/narrative/story-plan/random.js';

const catalog: SamStoryPlanCatalogSnapshotV1 = {
  segments: [
    { id: 'a', label: 'A', intentIds: ['i1'] },
    { id: 'b', label: 'B', intentIds: ['i2'] },
  ],
  engagementLevelIds: ['explorer', 'regular'],
  intentIds: ['i1', 'i2'],
  focusAreaIds: [],
  journeyIds: [],
  characterIds: [],
  episodeIds: [],
  jobIds: [],
  fleetPlaces: [],
  touchpointCount: 0,
  touchpointIdsSample: [],
};

describe('story-plan rng', () => {
  it('resolveStoryPlanRandom honors explicit random', () => {
    const random = resolveStoryPlanRandom({ random: () => 0.25 });
    expect(random()).toBe(0.25);
  });

  it('seeded Chance is stable for pickRandomFrom', () => {
    const a = pickRandomFrom(['x', 'y', 'z'], resolveStoryPlanRandom({ seed: 'story-plan-probe-1' }));
    const b = pickRandomFrom(['x', 'y', 'z'], resolveStoryPlanRandom({ seed: 'story-plan-probe-1' }));
    expect(a).toBe(b);
    expect(['x', 'y', 'z']).toContain(a);
  });

  it('storyPlanRandomFromChance matches Chance.floating range', () => {
    const chance = createStoryPlanChance(42);
    const random = storyPlanRandomFromChance(chance);
    for (let i = 0; i < 20; i++) {
      const n = random();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('planStoryCreateHeuristic seed picks a stable segment when scenario is ambiguous', () => {
    const first = planStoryCreateHeuristic({
      scenario: 'misc',
      catalog,
      seed: 'story-plan-misc',
    });
    const second = planStoryCreateHeuristic({
      scenario: 'misc',
      catalog,
      seed: 'story-plan-misc',
    });
    expect(first.segmentId).toBe(second.segmentId);
    expect(first.engagementLevelId).toBe(second.engagementLevelId);
  });
});
