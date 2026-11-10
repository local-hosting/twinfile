import { describe, expect, it } from 'vitest';

import { characterFromJSON, characterToJSON } from '../../../../src/catalog/character/contract/character/contract/json.js';
import type { Character } from '../../../../src/catalog/character/contract/character/types/character.js';

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
    traits: ['hurried', 'observant'],
    personality: {
      wants: 'A commute that does not eat the morning',
      fears: 'Missing the last reliable connection',
      flaw: 'Checks the app twice instead of walking',
      delivery: {
        patterns: ['Short clipped sentences'],
        lines: ['Is this still on time?'],
      },
      movement: ['Phone in hand at the curb'],
      temperament: ['Time-sensitive'],
      moods: ['Focused'],
      signatureMoves: ['Glance at the ETA, then the street'],
    },
  },
};

describe('character json', () => {
  it('round-trips toJSON/fromJSON', () => {
    const json = characterToJSON(sample);
    const restored = characterFromJSON(json);
    expect(restored.id).toBe(sample.id);
    expect(restored.persona.label).toBe('Rider');
    expect(restored.persona.personality?.wants).toBe(sample.persona.personality?.wants);
    expect(restored.persona.personality?.delivery?.lines).toEqual(['Is this still on time?']);
    expect(restored.persona.jobIds).toEqual(['job:commute']);
  });
});
