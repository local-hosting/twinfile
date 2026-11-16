import { describe, expect, it } from 'vitest';

import {
  parseStoryDimensions,
  StoryDimensionWhereSchema,
} from '../../src/contract/narrative/schemas/story-dimensions.schema.js';

describe('StoryDimensionsSchema', () => {
  it('parses a compiled episode projection', () => {
    const parsed = parseStoryDimensions({
      specVersion: '1.0',
      who: { characterId: 'persona:rider', characterIds: ['persona:rider'] },
      what: { episodeId: 'story:episode:commute', journeyId: 'journey:commute' },
      where: { placeRefs: ['twinfile/place/home:0.0.0'], primaryPlaceRef: 'twinfile/place/home:0.0.0' },
      when: {
        simulationEpochStart: '2026-01-06',
        planningHorizonDays: 42,
        visitDayIndex: 3,
      },
    });
    expect(parsed.where.primaryPlaceRef).toBe('twinfile/place/home:0.0.0');
    expect(parsed.who.characterId).toBe('persona:rider');
  });

  it('accepts a place mount without host geo', () => {
    const parsed = StoryDimensionWhereSchema.parse({
      placeRefs: ['twinfile/place/demo-airport:0.0.0'],
      primaryPlaceRef: 'twinfile/place/demo-airport:0.0.0',
    });
    expect(parsed.placeRefs).toEqual(['twinfile/place/demo-airport:0.0.0']);
  });
});
