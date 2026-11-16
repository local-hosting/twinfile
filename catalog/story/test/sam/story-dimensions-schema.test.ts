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
      where: { venueKeys: ['venue:home'], primaryVenueKey: 'venue:home' },
      when: {
        simulationEpochStart: '2026-01-06',
        planningHorizonDays: 42,
        visitDayIndex: 3,
      },
    });
    expect(parsed.where.primaryVenueKey).toBe('venue:home');
    expect(parsed.who.pcmId).toBe('persona:rider');
  });

  it('accepts a venue mount without host geo', () => {
    const parsed = SamStoryDimensionWhereSchema.parse({
      venueKeys: ['venue:demo-airport'],
      primaryVenueKey: 'venue:demo-airport',
    });
    expect(parsed.venueKeys).toEqual(['venue:demo-airport']);
  });
});
