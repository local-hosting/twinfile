import { describe, expect, it } from 'vitest';
import type { SamStoryDimensionsV1 } from '../../../src/contract/narrative/types/story-dimensions.js';
import {
  attachPlaceSlugFromPlaceRef,
  hostStoryWhereDimensionIsComplete,
  mergeSamStoryDimensionsWithHost,
} from '../../../src/contract/narrative/project/merge-sam-story-dimensions-with-host.js';

const samDimensions: SamStoryDimensionsV1 = {
  specVersion: '1.0',
  who: { pcmId: 'persona:rider', characterIds: ['persona:rider'] },
  what: { samEpisodeId: 'story:episode:rider-commute', journeyId: 'journey:rider-commute' },
  where: {
    placeRefs: ['twinfile/place/airport:0.0.0', 'twinfile/place/home:0.0.0'],
    primaryPlaceRef: 'twinfile/place/airport:0.0.0',
  },
  when: {
    simulationEpochStart: '2026-01-01',
    planningHorizonDays: 56,
    visitDayIndex: 7,
  },
  how: { journeyPace: 'medium' },
};

describe('mergeSamStoryDimensionsWithHost', () => {
  it('projects SAM placeRefs onto host where and keeps host storeSlug', () => {
    const merged = mergeSamStoryDimensionsWithHost(samDimensions, {
      who: { displayName: 'Alex', segmentId: 'commuter' },
      where: { storeSlug: 'store-001', lat: 35.2, lon: -80.8 },
      why: { engagementLevelId: 'explorer' },
    });

    expect(merged.who).toEqual({
      pcmId: 'persona:rider',
      characterIds: ['persona:rider'],
      displayName: 'Alex',
      segmentId: 'commuter',
    });
    expect(merged.what?.samEpisodeId).toBe('story:episode:rider-commute');
    expect(merged.where.primaryPlaceRef).toBe('twinfile/place/airport:0.0.0');
    expect(merged.where.placeRef).toBe('twinfile/place/airport:0.0.0');
    expect(merged.where.placeRefs).toEqual([
      'twinfile/place/airport:0.0.0',
      'twinfile/place/home:0.0.0',
    ]);
    expect(merged.where.storeSlug).toBe('store-001');
    expect(merged.when?.visitDayOffset).toBe(7);
    expect(merged.why?.engagementLevelId).toBe('explorer');
    expect(merged.how?.journeyPace).toBe('medium');
  });
});

describe('hostStoryWhereDimensionIsComplete', () => {
  it('accepts primaryPlaceRef from SAM where', () => {
    expect(
      hostStoryWhereDimensionIsComplete({ primaryPlaceRef: 'twinfile/place/airport:0.0.0' }),
    ).toBe(true);
  });

  it('accepts fleet storeSlug', () => {
    expect(hostStoryWhereDimensionIsComplete({ storeSlug: 'store-001' })).toBe(true);
  });

  it('rejects empty where', () => {
    expect(hostStoryWhereDimensionIsComplete({})).toBe(false);
  });
});

describe('attachPlaceSlugFromPlaceRef', () => {
  it('derives venueSlug from twinfile placeRef when missing', () => {
    const bound = attachPlaceSlugFromPlaceRef({
      placeRef: 'twinfile/place/demo-airport:0.0.0',
      lat: 1,
      lon: 2,
    });
    expect(bound.venueSlug).toBe('demo-airport');
    expect(bound.placeRef).toBe('twinfile/place/demo-airport:0.0.0');
  });

  it('derives venueSlug from legacy venue: mount ids', () => {
    const bound = attachPlaceSlugFromPlaceRef({ placeRef: 'venue:demo-airport' });
    expect(bound.venueSlug).toBe('demo-airport');
  });
});
