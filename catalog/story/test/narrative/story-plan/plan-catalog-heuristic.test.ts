import { describe, expect, it } from 'vitest';
import { planStoryCreateHeuristic } from '../../../src/contract/narrative/story-plan/plan-catalog-heuristic.js';
import type { StoryPlanCatalogSnapshotV1 } from '../../../src/contract/narrative/types/story-plan-catalog.js';

const catalog: StoryPlanCatalogSnapshotV1 = {
  segments: [
    {
      id: 'segment:loyal-shopper',
      label: 'Loyal shopper',
      topic: 'repeat visits',
      intentIds: ['intent:save-time'],
    },
    {
      id: 'segment:first-visit',
      label: 'First visit',
      topic: 'discovery',
      intentIds: ['intent:explore'],
    },
  ],
  engagementLevelIds: ['regular', 'stranger', 'champion'],
  intentIds: ['intent:save-time', 'intent:explore'],
  focusAreaIds: [],
  journeyIds: [],
  characterIds: [],
  storyIds: [],
  jobIds: [],
  fleetPlaces: [
    { slug: 'airport-kiosk', name: 'Airport kiosk' },
    { slug: 'downtown-flagship', name: 'Downtown flagship' },
  ],
  touchpointCount: 0,
  touchpointIdsSample: [],
};

describe('planStoryCreateHeuristic', () => {
  it('matches segment and store from scenario tokens', () => {
    const result = planStoryCreateHeuristic({
      scenario: 'A loyal shopper stops at the downtown flagship for a quick errand',
      catalog,
      random: () => 0,
    });
    expect(result.segmentId).toBe('segment:loyal-shopper');
    expect(result.storeSlug).toBe('downtown-flagship');
    expect(result.intentIds).toHaveLength(1);
  });

  it('honors explicit segmentId', () => {
    const result = planStoryCreateHeuristic({
      scenario: 'anything',
      catalog,
      segmentId: 'segment:first-visit',
      random: () => 0,
    });
    expect(result.segmentId).toBe('segment:first-visit');
  });
});
