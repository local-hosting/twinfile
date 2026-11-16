import { describe, expect, it } from 'vitest';

import {
  parseSamStoryDimensions,
  SamStoryDimensionWhereSchema,
} from '../../src/contract/narrative/schemas/story-dimensions.schema.js';

describe('SamStoryDimensionsSchema', () => {
  it('parses a compiled episode projection', () => {
    const parsed = parseSamStoryDimensions({
      specVersion: '1.0',
      who: { pcmId: 'persona:rider', characterIds: ['persona:rider'] },
      what: { samEpisodeId: 'story:episode:commute', journeyId: 'journey:commute' },
      where: { placeRefs: ['twinfile/place/home:0.0.0'], primaryPlaceRef: 'twinfile/place/home:0.0.0' },
      when: {
        simulationEpochStart: '2026-01-06',
        planningHorizonDays: 42,
        visitDayIndex: 3,
      },
    });
    expect(parsed.where.primaryPlaceRef).toBe('twinfile/place/home:0.0.0');
    expect(parsed.who.pcmId).toBe('persona:rider');
  });

  it('accepts a place mount without host geo', () => {
    const parsed = SamStoryDimensionWhereSchema.parse({
      placeRefs: ['twinfile/place/demo-airport:0.0.0'],
      primaryPlaceRef: 'twinfile/place/demo-airport:0.0.0',
    });
    expect(parsed.placeRefs).toEqual(['twinfile/place/demo-airport:0.0.0']);
  });
});
