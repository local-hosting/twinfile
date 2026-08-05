import { describe, expect, it } from 'vitest';

import { validateSamNarrativeCoherence } from '../../../src/contract/narrative/contract/validate-sam-narrative-coherence.js';
import { storyboardSamFixture } from '../helpers/storyboard-sam-fixture.js';

describe('validateSamNarrativeCoherence', () => {
  it('flags airport place labels on commute journeys', () => {
    const sam = storyboardSamFixture({
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
      personaId: 'persona:rider',
      phases: [],
    };

    const result = validateSamNarrativeCoherence(sam, journey);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toContain('Airport pickup');
    }
  });

  it('passes when commute mount is relabeled', () => {
    const sam = storyboardSamFixture({
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
      personaId: 'persona:rider',
      phases: [],
    };

    expect(validateSamNarrativeCoherence(sam, journey).ok).toBe(true);
  });
});
