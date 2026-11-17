import { describe, expect, it } from 'vitest';

import { parseStory } from '../../src/contract/narrative/schemas/story-narrative.schema.js';
import { validateStoryNarrativeStoryArc } from '../../src/contract/narrative/contract/validate-story-story-arc.js';

const baseSceneboard = {
  characters: [{ characterId: 'persona:rider', primary: true }],
  places: [{ placeRef: 'twinfile/place/curbside:0.0.0' }],
  binding: {
    characterId: 'persona:rider',
    journeyId: 'journey:fixture',
    simulationEpochStart: '2026-01-06',
  },
};

describe('validateStoryNarrativeStoryArc', () => {
  it('accepts a shortened man_in_a_hole rail (exposition → denouement)', () => {
    const story = parseStory({
      id: 'story:driver-offer',
      title: 'Offer',
      revision: 1,
      ...baseSceneboard,
      arcTemplate: {
        id: 'arc:driver-offer',
        label: 'Offer decision',
        kind: 'man_in_a_hole',
        acts: [
          { id: 'exposition', label: 'Alert', order: 0 },
          { id: 'denouement', label: 'Decide', order: 1 },
        ],
      },
      scenes: [
        {
          id: 'scene:notify',
          label: 'Notify',
          order: 0,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
          touchpointIds: ['touchpoint:a'],
        },
        {
          id: 'scene:decide',
          label: 'Decide',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
          touchpointIds: ['touchpoint:b'],
        },
      ],
    });

    expect(validateStoryNarrativeStoryArc(story)).toEqual({ ok: true });
  });

  it('rejects scenes that regress on the beat rail', () => {
    const story = parseStory({
      id: 'story:bad',
      title: 'Bad',
      revision: 1,
      ...baseSceneboard,
      arcTemplate: {
        id: 'arc:bad',
        label: 'Bad',
        kind: 'man_in_a_hole',
        acts: [
          { id: 'exposition', label: 'Setup', order: 0 },
          { id: 'climax', label: 'Peak', order: 1 },
          { id: 'denouement', label: 'End', order: 2 },
        ],
      },
      scenes: [
        {
          id: 'scene:peak',
          label: 'Peak',
          order: 0,
          actId: 'climax',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
        },
        {
          id: 'scene:setup',
          label: 'Setup',
          order: 1,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
        },
      ],
    });

    const result = validateStoryNarrativeStoryArc(story);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((line) => line.includes('regresses the arc'))).toBe(true);
    }
  });

  it('requires every arc beat to have at least one scene', () => {
    const story = parseStory({
      id: 'story:gap',
      title: 'Gap',
      revision: 1,
      ...baseSceneboard,
      arcTemplate: {
        id: 'arc:gap',
        label: 'Gap',
        kind: 'man_in_a_hole',
        acts: [
          { id: 'exposition', label: 'Setup', order: 0 },
          { id: 'climax', label: 'Peak', order: 1 },
          { id: 'denouement', label: 'End', order: 2 },
        ],
      },
      scenes: [
        {
          id: 'scene:setup',
          label: 'Setup',
          order: 0,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
        },
        {
          id: 'scene:end',
          label: 'End',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
        },
      ],
    });

    const result = validateStoryNarrativeStoryArc(story);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((line) => line.includes('climax'))).toBe(true);
    }
  });
});
