import { describe, expect, it } from 'vitest';

import { characterFromJSON, characterToJSON } from '../../src/contract/persona/contract/json.js';
import type { Character } from '../../src/contract/persona/types/character.js';

const sample: Character = {
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

describe('character json', () => {
  it('round-trips toJSON/fromJSON', () => {
    const json = characterToJSON(sample);
    const restored = characterFromJSON(json);
    expect(restored.id).toBe(sample.id);
    expect(restored.persona.label).toBe('Rider');
    expect(restored.jobs).toHaveLength(1);
  });
});
