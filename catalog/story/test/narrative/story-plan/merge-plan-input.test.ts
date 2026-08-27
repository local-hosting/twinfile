import { describe, expect, it } from 'vitest';
import { mergeStoryPlanInput } from '../../../src/contract/narrative/story-plan/plan-corpus.js';

describe('mergeStoryPlanInput', () => {
  it('keeps explicit fields over extracted hints', () => {
    const merged = mergeStoryPlanInput(
      {
        request: 'Plan a visit',
        segmentId: 'early-adopter',
        storeSlug: 'SAC06',
      },
      {
        segmentId: 'comparison-shopper',
        storeSlug: 'SAA01',
        goals: ['compare plans'],
        planningHorizonDays: 56,
      },
    );
    expect(merged.segmentId).toBe('early-adopter');
    expect(merged.storeSlug).toBe('SAC06');
    expect(merged.goals).toEqual(['compare plans']);
    expect(merged.planningHorizonDays).toBe(56);
  });
});
