import { describe, expect, it } from 'vitest';

import { pcmFromJSON, pcmToJSON } from '../../src/contract/persona/contract/json.js';
import type { PCM } from '../../src/contract/persona/types/pcm.js';

const sample: PCM = {
  version: 1,
  id: 'persona:rider',
  title: 'Rider',
  revision: 1,
  persona: {
    id: 'persona:rider',
    label: 'Rider',
    quote: 'I need to get there on time.',
    goals: ['Arrive on time'],
    frustrations: ['Unpredictable ETAs'],
    segment: 'commuter',
    jobIds: ['job:commute'],
  },
  jobs: [
    {
      id: 'job:commute',
      text: 'Get to work reliably',
      when: 'I am getting ready for work',
      want: 'to request a ride',
      so: 'I can get to work on time',
    },
  ],
};

describe('pcm json', () => {
  it('round-trips toJSON/fromJSON', () => {
    const json = pcmToJSON(sample);
    const restored = pcmFromJSON(json);
    expect(restored.id).toBe(sample.id);
    expect(restored.persona.label).toBe('Rider');
    expect(restored.jobs).toHaveLength(1);
  });
});
