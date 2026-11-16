import type { SAM } from '../../../src/contract/narrative/types/sam.js';

/** Minimal valid storyboard SAM for schema / JSON tests. */
export function storyboardSamFixture(overrides?: Partial<SAM>): SAM {
  return {
    version: 1,
    id: 'story:episode:fixture',
    title: 'Fixture episode',
    revision: 1,
    characters: [{ pcmId: 'persona:rider', primary: true }],
    venues: [{ venueKey: 'venue:curbside' }],
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
        venueKey: 'venue:curbside',
        touchpointIds: ['touchpoint:a'],
      },
      {
        id: 'scene:b',
        label: 'Close',
        order: 1,
        actId: 'denouement',
        characterIds: ['persona:rider'],
        venueKey: 'venue:curbside',
        touchpointIds: ['touchpoint:b'],
      },
    ],
    binding: {
      pcmId: 'persona:rider',
      journeyId: 'journey:fixture',
      simulationEpochStart: '2026-01-06',
    },
    ...overrides,
  };
}
