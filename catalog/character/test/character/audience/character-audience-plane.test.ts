import { describe, expect, it } from 'vitest';
import { normalizeCharacterAudiencePlane } from '../../../src/contract/character/audience/normalize-audience-plane-weights.js';
import { parseCharacter } from '../../../src/contract/character/schemas/character.schema.js';

describe('Character audience planes (demographic ↔ psychographic symmetry)', () => {
  it('accepts matching demographic and psychographic shapes on persona', () => {
    const character = parseCharacter({
      version: 1,
      id: 'persona:demo',
      title: 'Demo',
      revision: 1,
      persona: {
        id: 'persona:demo',
        label: 'Demo',
        quote: 'Hello',
        segment: 'urban',
        goals: [],
        frustrations: [],
        jobIds: [],
        demographic: {
          profileId: 'demo:millennial-urban',
          aspects: [
            { frameworkId: 'us_census_age', typeId: '25_34', weight: 0.6, source: 'declared' },
            { frameworkId: 'household_income', typeId: '75k_100k', weight: 0.4 },
          ],
        },
        psychographic: {
          profileId: 'psy:time-starved-optimizer',
          aspects: [
            { frameworkId: 'myers_briggs', typeId: 'ENTJ', weight: 0.5, source: 'declared' },
            { frameworkId: 'vals', typeId: 'achiever', weight: 0.5 },
          ],
        },
      },
    });

    expect(character.persona.demographic?.aspects).toHaveLength(2);
    expect(character.persona.psychographic?.aspects).toHaveLength(2);
    expect(character.persona.psychographic?.aspects[0]?.frameworkId).toBe('myers_briggs');
  });

  it('normalizes aspect weights to sum to 1 per plane', () => {
    const normalized = normalizeCharacterAudiencePlane({
      aspects: [
        { frameworkId: 'myers_briggs', typeId: 'ENTJ', weight: 1 },
        { frameworkId: 'vals', typeId: 'achiever', weight: 1 },
      ],
    });
    const sum = normalized.aspects.reduce((acc, row) => acc + (row.weight ?? 0), 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
