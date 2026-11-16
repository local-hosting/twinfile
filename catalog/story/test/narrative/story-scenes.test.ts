import { describe, expect, it } from 'vitest';

import { compileStory } from '../../src/contract/narrative/contract/compile-story-narrative.js';
import { parseStory } from '../../src/contract/narrative/schemas/story-narrative.schema.js';

describe('Story storyboard scenes', () => {
  it('compiles episode arc from scenes without a journey document', () => {
    const story = parseStory({
      id: 'story:board:1',
      title: 'Board',
      revision: 1,
      characters: [{ characterId: 'persona:rider', primary: true }],
      places: [{ placeRef: 'twinfile/place/curbside:0.0.0' }],
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
          placeRef: 'twinfile/place/curbside:0.0.0',
          touchpointIds: ['touchpoint:a'],
        },
        {
          id: 'scene:ride',
          label: 'In car',
          order: 1,
          actId: 'climax',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
          touchpointIds: ['touchpoint:b'],
        },
        {
          id: 'scene:arrive',
          label: 'Arrive',
          order: 2,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/curbside:0.0.0',
          touchpointIds: ['touchpoint:c'],
        },
      ],
      binding: {
        characterId: 'persona:rider',
        journeyId: 'journey:board',
        simulationEpochStart: '2026-01-06',
        visitDayIndex: 21,
      },
    });

    const result = compileStory({ story });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.story.episodeArc?.objectiveTouchpointIds).toEqual([
      'touchpoint:a',
      'touchpoint:b',
      'touchpoint:c',
    ]);
  });
});
