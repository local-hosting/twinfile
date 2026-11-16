import type { Story } from '../../../src/contract/narrative/types/story-narrative.js';

/** Minimal valid storyboard Story for schema / JSON tests. */
export function storyboardStoryFixture(overrides?: Partial<Story>): Story {
  return {
    version: 1,
    id: 'story:episode:fixture',
    title: 'Fixture episode',
    revision: 1,
    characters: [{ characterId: 'persona:rider', primary: true }],
    places: [{ placeRef: 'twinfile/place/curbside:0.0.0' }],
    arcTemplate: {
      id: 'arc:fixture',
      label: 'Fixture arc',
      kind: 'man_in_a_hole',
      acts: [
        { id: 'exposition', label: 'Setup', order: 0 },
        { id: 'denouement', label: 'End', order: 1 },
      ],
    },
    scenes: [
      {
        id: 'scene:a',
        label: 'Open',
        order: 0,
        actId: 'exposition',
        characterIds: ['persona:rider'],
        placeRef: 'twinfile/place/curbside:0.0.0',
        touchpointIds: ['touchpoint:a'],
      },
      {
        id: 'scene:b',
        label: 'Close',
        order: 1,
        actId: 'denouement',
        characterIds: ['persona:rider'],
        placeRef: 'twinfile/place/curbside:0.0.0',
        touchpointIds: ['touchpoint:b'],
      },
    ],
    binding: {
      characterId: 'persona:rider',
      journeyId: 'journey:fixture',
      simulationEpochStart: '2026-01-06',
    },
    ...overrides,
  };
}
