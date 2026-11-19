import { describe, expect, it } from 'vitest';
import { deriveEpisodeTimingFromJobs } from '../../../../../src/contract/narrative/episode/derive-episode-timing-from-jobs.js';

const commuteJourney = {
  id: 'journey:rider-commute',
  journeyGoal: 'Arrive on time',
  label: 'Commute',
  characterId: 'persona:rider',
  phases: [
    {
      id: 'phase:plan',
      label: 'Plan',
      order: 0,
      jobIds: ['job:commute-work'],
      touchpointIds: ['touchpoint:rider-open-home'],
    },
    {
      id: 'phase:ride',
      label: 'Ride',
      order: 1,
      jobIds: ['job:wait-eta'],
      touchpointIds: ['touchpoint:rider-live-map'],
    },
  ],
} as const;

describe('deriveEpisodeTimingFromJobs', () => {
  it('uses a single session day for commute-shaped journeys', () => {
    const timing = deriveEpisodeTimingFromJobs({ journey: commuteJourney as never });
    expect(timing.session).toBe(true);
    expect(timing.planningHorizonDays).toBe(1);
    expect(timing.visitDayIndex).toBe(0);
  });
});
