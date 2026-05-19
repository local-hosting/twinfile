import { describe, expect, it } from 'vitest';

import { compileSAM } from '../../src/contract/narrative/contract/compile-sam.js';
import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';

describe('SAM storyboard scenes', () => {
  it('compiles episode arc from scenes without a journey document', () => {
    const sam = parseSAM({
      id: 'story:board:1',
      title: 'Board',
      revision: 1,
      characters: [{ pcmId: 'persona:rider', primary: true }],
      venues: [{ venueKey: 'venue:curbside' }],
      arcTemplate: {
        id: 'arc:commute-hole',
        label: 'Commute hole',
        kind: 'man_in_a_hole',
        acts: [
          { id: 'exposition', label: 'Setup', order: 0 },
          { id: 'climax', label: 'Turn', order: 1 },
          { id: 'denouement', label: 'Resolution', order: 2 },
        ],
      },
      scenes: [
        {
          id: 'scene:open',
          label: 'Open app',
          order: 0,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
          touchpointIds: ['touchpoint:a'],
        },
        {
          id: 'scene:ride',
          label: 'In car',
          order: 1,
          actId: 'climax',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
          touchpointIds: ['touchpoint:b'],
        },
        {
          id: 'scene:arrive',
          label: 'Arrive',
          order: 2,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:curbside',
          touchpointIds: ['touchpoint:c'],
        },
      ],
      binding: {
        pcmId: 'persona:rider',
        journeyId: 'journey:board',
        simulationEpochStart: '2026-01-06',
        visitDayIndex: 21,
      },
    });

    const result = compileSAM({ sam });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sam.episodeArc?.objectiveTouchpointIds).toEqual([
      'touchpoint:a',
      'touchpoint:b',
      'touchpoint:c',
    ]);
  });
});
