import { describe, expect, it } from 'vitest';

import { validateSamNarrativeCoherence } from '../../../src/contract/narrative/contract/validate-sam-narrative-coherence.js';
import { storyboardSamFixture } from '../helpers/storyboard-sam-fixture.js';

describe('validateSamNarrativeCoherence', () => {
  it('flags airport venue labels on commute journeys', () => {
    const sam = storyboardSamFixture({
      venues: [
        { venueKey: 'venue:demo-home', label: 'Home dropoff' },
        { venueKey: 'venue:demo-airport', label: 'Airport pickup' },
      ],
      scenes: [
        {
          id: 'scene:wait',
          label: 'Wait',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:demo-airport',
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
      venues: [
        { venueKey: 'venue:demo-home', label: 'Home dropoff' },
        { venueKey: 'venue:demo-airport', label: 'Curbside pickup' },
      ],
      scenes: [
        {
          id: 'scene:wait',
          label: 'Wait',
          order: 1,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:demo-airport',
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
