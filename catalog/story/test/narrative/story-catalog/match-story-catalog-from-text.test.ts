import { describe, expect, it } from 'vitest';
import { matchStoryCatalogIdsFromText } from '../../../src/contract/narrative/story-catalog/match-story-catalog-from-text.js';
import type { StoryCatalogMenuV1 } from '../../../src/contract/narrative/types/story-catalog-menu.js';

const menu: StoryCatalogMenuV1 = {
  characters: [
    { characterId: 'persona:rider', label: 'Rider', journeyIds: ['journey:rider-commute'] },
    { characterId: 'persona:driver', label: 'Driver', journeyIds: ['journey:driver-offer'] },
  ],
  stories: [
    {
      id: 'story:rider-commute',
      title: 'Rider commute episode',
      focalCharacterId: 'persona:rider',
    },
    {
      id: 'story:driver-offer',
      title: 'Driver offer episode',
      focalCharacterId: 'persona:driver',
    },
  ],
  places: [
    { placeRef: 'twinfile/place/demo-airport:0.0.0', title: 'Airport pickup' },
    { placeRef: 'twinfile/place/demo-home:0.0.0', title: 'Home dropoff' },
  ],
};

describe('matchStoryCatalogIdsFromText', () => {
  it('matches rider commute without inferring place from NL by default', () => {
    const hints = matchStoryCatalogIdsFromText({
      text: 'Rider morning commute from home dropoff',
      menu,
    });
    expect(hints.characterId).toBe('persona:rider');
    expect(hints.storyId).toBe('story:rider-commute');
    expect(hints.placeRef).toBeUndefined();
  });

  it('matches place mount when includePlaces is true', () => {
    const hints = matchStoryCatalogIdsFromText({
      text: 'Rider morning commute from home dropoff',
      menu,
      includePlaces: true,
    });
    expect(hints.placeRef).toBe('twinfile/place/demo-home:0.0.0');
  });

  it('matches driver offer episode when driver is mentioned', () => {
    const hints = matchStoryCatalogIdsFromText({
      text: 'Driver receives an offer notification during shift',
      menu,
      focalCharacterId: 'persona:driver',
    });
    expect(hints.characterId).toBe('persona:driver');
    expect(hints.storyId).toBe('story:driver-offer');
  });

  it('matches airport place when airport is mentioned and place matching enabled', () => {
    const hints = matchStoryCatalogIdsFromText({
      text: 'Vacation landing at airport pickup',
      menu,
      includePlaces: true,
    });
    expect(hints.placeRef).toBe('twinfile/place/demo-airport:0.0.0');
  });
});
