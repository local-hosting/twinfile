import { describe, expect, it } from 'vitest';

import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';
import { validateSAMStoryArc } from '../../src/contract/narrative/contract/validate-sam-story-arc.js';

const baseSceneboard = {
  characters: [{ pcmId: 'persona:rider', primary: true }],
  venues: [{ venueKey: 'venue:curbside' }],
  binding: {
    pcmId: 'persona:rider',
    journeyId: 'journey:fixture',
    simulationEpochStart: '2026-01-06',
  },
};

describe('validateSAMStoryArc', () => {
  it('accepts a shortened man_in_a_hole rail (exposition → denouement)', () => {
    const sam = parseSAM({
      id: 'story:episode:driver-offer',
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
          venueKey: 'venue:curbside',
          touchpointIds: ['touchpoint:a'],
        },
        {
          id: 'scene:decide',
          label: 'Decide',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
          touchpointIds: ['touchpoint:b'],
        },
      ],
    });

    expect(validateSAMStoryArc(sam)).toEqual({ ok: true });
  });

  it('rejects scenes that regress on the beat rail', () => {
    const sam = parseSAM({
      id: 'story:episode:bad',
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
          venueKey: 'venue:curbside',
        },
        {
          id: 'scene:setup',
          label: 'Setup',
          order: 1,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
        },
      ],
    });

    const result = validateSAMStoryArc(sam);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((line) => line.includes('regresses the arc'))).toBe(true);
    }
  });

  it('requires every arc beat to have at least one scene', () => {
    const sam = parseSAM({
      id: 'story:episode:gap',
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
          venueKey: 'venue:curbside',
        },
        {
          id: 'scene:end',
          label: 'End',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
        },
      ],
    });

    const result = validateSAMStoryArc(sam);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((line) => line.includes('climax'))).toBe(true);
    }
  });
});
