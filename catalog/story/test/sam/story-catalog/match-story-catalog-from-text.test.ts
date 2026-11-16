import { describe, expect, it } from 'vitest';
import { matchSamStoryCatalogIdsFromText } from '../../../src/contract/narrative/story-catalog/match-story-catalog-from-text.js';
import type { SamStoryCatalogMenuV1 } from '../../../src/contract/narrative/types/story-catalog-menu.js';

const menu: SamStoryCatalogMenuV1 = {
  characters: [
    { pcmId: 'persona:rider', label: 'Rider', journeyIds: ['journey:rider-commute'] },
    { pcmId: 'persona:driver', label: 'Driver', journeyIds: ['journey:driver-offer'] },
  ],
  episodes: [
    {
      id: 'story:episode:rider-commute',
      title: 'Rider commute episode',
      focalPcmId: 'persona:rider',
      journeyId: 'journey:rider-commute',
    },
    {
      id: 'story:episode:driver-offer',
      title: 'Driver offer episode',
      focalPcmId: 'persona:driver',
      journeyId: 'journey:driver-offer',
    },
  ],
  placeVenues: [
    { venueKey: 'venue:demo-airport', title: 'Airport pickup' },
    { venueKey: 'venue:demo-home', title: 'Home dropoff' },
  ],
};

describe('matchSamStoryCatalogIdsFromText', () => {
  it('matches rider commute without inferring place from NL by default', () => {
    const hints = matchSamStoryCatalogIdsFromText({
      text: 'Rider morning commute from home dropoff',
      menu,
    });
    expect(hints.pcmId).toBe('persona:rider');
    expect(hints.episodeId).toBe('story:episode:rider-commute');
    expect(hints.venueKey).toBeUndefined();
  });

  it('matches place mount when includePlaceVenues is true', () => {
    const hints = matchSamStoryCatalogIdsFromText({
      text: 'Rider morning commute from home dropoff',
      menu,
      includePlaceVenues: true,
    });
    expect(hints.venueKey).toBe('venue:demo-home');
  });

  it('matches driver offer episode when driver is mentioned', () => {
    const hints = matchSamStoryCatalogIdsFromText({
      text: 'Driver receives an offer notification during shift',
      menu,
      focalPcmId: 'persona:driver',
    });
    expect(hints.pcmId).toBe('persona:driver');
    expect(hints.episodeId).toBe('story:episode:driver-offer');
  });

  it('matches airport venue when airport is mentioned and place matching enabled', () => {
    const hints = matchSamStoryCatalogIdsFromText({
      text: 'Vacation landing at airport pickup',
      menu,
      includePlaceVenues: true,
    });
    expect(hints.venueKey).toBe('venue:demo-airport');
  });
});
