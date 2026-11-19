import { describe, expect, it } from 'vitest';

import { validateStoryNarrativeCoherence } from '../../../../src/contract/narrative/contract/validate-story-narrative-coherence.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

describe('validateStoryNarrativeCoherence', () => {
  it('flags airport place labels on commute journeys', () => {
    const story = storyboardStoryFixture({
      places: [
        { placeRef: 'twinfile/place/demo-home:0.0.0', label: 'Home dropoff' },
        { placeRef: 'twinfile/place/demo-airport:0.0.0', label: 'Airport pickup' },
      ],
      scenes: [
        {
          id: 'scene:wait',
          label: 'Wait',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/demo-airport:0.0.0',
          touchpointIds: ['touchpoint:rider-live-map'],
        },
      ],
    });
    const journey = {
      id: 'journey:rider-commute',
      label: 'Morning commute',
      journeyGoal: 'Arrive at work on time',
      characterId: 'persona:rider',
      phases: [],
    };

    const result = validateStoryNarrativeCoherence(story, journey);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toContain('Airport pickup');
    }
  });

  it('passes when commute mount is relabeled', () => {
    const story = storyboardStoryFixture({
      places: [
        { placeRef: 'twinfile/place/demo-home:0.0.0', label: 'Home dropoff' },
        { placeRef: 'twinfile/place/demo-airport:0.0.0', label: 'Curbside pickup' },
      ],
      scenes: [
        {
          id: 'scene:wait',
          label: 'Wait',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/demo-airport:0.0.0',
          touchpointIds: ['touchpoint:rider-live-map'],
        },
      ],
    });
    const journey = {
      id: 'journey:rider-commute',
      label: 'Morning commute',
      journeyGoal: 'Arrive at work on time',
      characterId: 'persona:rider',
      phases: [],
    };

    expect(validateStoryNarrativeCoherence(story, journey).ok).toBe(true);
  });
});
