import { describe, expect, it } from 'vitest';
import { rankJobsForPersona } from '../../src/contract/job/rank-jobs-for-persona.js';

const character = {
  persona: {
    id: 'persona:rider',
    label: 'Urban commuter',
    quote: 'I need a reliable ride to the airport',
    segment: 'segment:commuter',
    goals: ['get to work on time'],
    frustrations: ['unpredictable traffic'],
    jobIds: ['job:airport-run'],
    journeyPace: 'fast',
  },
  journeys: [] as const,
};

describe('rankJobsForPersona', () => {
  it('prefers explicit persona.jobIds then text overlap', () => {
    const ranked = rankJobsForPersona(character, {
      id: 'jsm:travel',
      label: 'Travel',
      context: 'mobility',
      jobs: [
        {
          id: 'job:grocery',
          text: 'Grocery',
          context: 'weekend',
          goal: 'stock pantry',
          outcome: 'eat well',
        },
        {
          id: 'job:airport-run',
          text: 'Airport trip',
          context: 'flight day',
          goal: 'reach airport on time',
          outcome: 'catch the plane',
        },
      ],
    });
    expect(ranked[0]?.job.id).toBe('job:airport-run');
    expect(ranked[0]?.explicit).toBe(true);
  });
});
