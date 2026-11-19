import { describe, expect, it } from 'vitest';
import type { Character } from '@local-hosting/twinfile/character';
import type { Story } from '../../../../../src/contract/narrative/types/story-narrative.js';
import { assembleBelievableEpisodeFromCharacter } from '../../../../../src/contract/narrative/story/assemble-believable-episode-from-character.js';
import { placeMountFixture } from '../helpers/place-mount-fixture.js';

const character: Character = {
  version: 1,
  id: 'character:rider',
  revision: 1,
  title: 'Rider',
  persona: {
    id: 'persona:rider',
    label: 'Rider',
    quote: 'Commute to work',
    segment: 'commuter',
    goals: ['reliable transport'],
    frustrations: [],
    jobIds: ['job:commute'],
    journeyPace: 'medium',
  },
  journeys: [
    {
      id: 'journey:commute',
      characterId: 'persona:rider',
      label: 'Commute',
      phases: [
        {
          id: 'phase:morning',
          label: 'Morning',
          order: 0,
          jobIds: ['job:commute'],
          touchpointIds: ['tp:store'],
          emotions: {},
        },
      ],
    },
  ],
};

const story: Story = {
  version: 1,
  id: 'story:commute',
  revision: 1,
  title: 'Commute episode',
  binding: {
    characterId: 'persona:rider',
    journeyId: 'journey:commute',
    simulationEpochStart: '2026-01-01',
    planningHorizonDays: 56,
    visitDayIndex: 20,
  },
  characters: [{ characterId: 'persona:rider', role: 'focal' }],
  places: [{ placeRef: 'twinfile/place/store:0.0.0' }],
  arcTemplate: {
    id: 'arc:commute-visit',
    label: 'Commute visit',
    kind: 'man_in_a_hole',
    acts: [{ id: 'climax', label: 'Visit', order: 0 }],
  },
  scenes: [
    {
      id: 'scene:visit',
      label: 'Store visit',
      actId: 'climax',
      order: 0,
      characterIds: ['persona:rider'],
      placeRef: 'twinfile/place/store:0.0.0',
      touchpointIds: ['tp:store'],
      jobIds: ['job:commute'],
    },
  ],
};

const storeMount = placeMountFixture({
  placeRef: 'twinfile/place/store:0.0.0',
  title: 'Store',
  spaceIds: ['space:floor'],
});

describe('assembleBelievableEpisodeFromCharacter', () => {
  it('resolves episode id and compiles when touchpoint catalog is provided', () => {
    const result = assembleBelievableEpisodeFromCharacter({
      focalCharacter: character,
      characters: [character],
      placeMounts: [storeMount],
      stories: [story],
      context: {
        id: 'context:commute',
        label: 'Commute',
        context: 'daily',
        jobs: [
          {
            id: 'job:commute',
            text: 'Commute',
            context: 'morning',
            goal: 'get to work',
            outcome: 'earn a living',
          },
        ],
      },
      touchpointCatalog: {
        touchpoints: [{ id: 'tp:store', label: 'Store', journeyPhase: 'visit' }],
        hubTouchpointId: 'tp:store',
      },
      simulationEpochStart: '2026-03-01',
      scenario: 'morning commute',
    });
    expect(result.assembly.storyId).toBe('story:commute');
    expect(result.assembly.rankedJobIds).toContain('job:commute');
    expect(result.dimensions.when.storyArc).toBeDefined();
  });
});
