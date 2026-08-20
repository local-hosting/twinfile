import { describe, expect, it } from 'vitest';
import type { Journey } from '@local-hosting/twinfile-character/persona';

import { parseStory } from '../../src/contract/narrative/schemas/story-narrative.schema.js';
import { validateStoryNarrativeAssociations } from '../../src/contract/narrative/contract/validate-story-associations.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

const journey = {
  id: 'journey:fixture',
  label: 'Commute',
  personaId: 'persona:rider',
  phases: [
    {
      id: 'p1',
      label: 'Plan',
      order: 0,
      jobIds: ['need:1'],
      touchpointIds: ['touchpoint:a'],
      emotions: { band: 'mid' },
    },
    {
      id: 'p2',
      label: 'Ride',
      order: 1,
      jobIds: ['need:1'],
      touchpointIds: ['touchpoint:b'],
      emotions: { band: 'mid' },
    },
  ],
} as Journey;

describe('Story associations', () => {
  it('defaults characters from binding.characterId on parse', () => {
    const { characters: _characters, ...body } = storyboardStoryFixture();
    const story = parseStory(body);
    expect(story.characters).toEqual([{ characterId: 'persona:rider', primary: true }]);
  });

  it('accepts multiple characters and places', () => {
    const story = parseStory({
      ...storyboardStoryFixture(),
      characters: [
        { characterId: 'persona:rider', primary: true },
        { characterId: 'persona:driver', role: 'counterpart' },
      ],
      places: [{ placeRef: 'twinfile/place/hub:0.0.0' }, { placeRef: 'twinfile/place/store:0.0.0' }],
    });
    expect(story.places).toHaveLength(2);
    const check = validateStoryNarrativeAssociations(story, {
      journey,
      knownCharacterIds: ['persona:rider', 'persona:driver'],
      knownPlaceRefs: ['twinfile/place/hub:0.0.0', 'twinfile/place/store:0.0.0'],
    });
    expect(check.ok).toBe(true);
  });

  it('twinfile-character-', () => {
    const story = parseStory({
      ...storyboardStoryFixture(),
      places: [{ placeRef: 'twinfile/place/missing:0.0.0' }],
    });
    const check = validateStoryNarrativeAssociations(story, {
      journey,
      knownCharacterIds: ['persona:rider'],
      knownPlaceRefs: ['twinfile/place/hub:0.0.0'],
    });
    expect(check.ok).toBe(false);
    if (check.ok) return;
    expect(check.issues.join(' ')).toMatch(/unknown placeRef/);
  });
});
