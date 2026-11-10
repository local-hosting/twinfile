import { describe, expect, it } from 'vitest';

import type { Character } from '../../../../../src/catalog/character/contract/character/types/character.js';
import { hydrateCharacterSignalsFromDimensions } from '../../../../../src/catalog/character/contract/character/story/hydrate-character-signals-from-dimensions.js';

const basePcm: Character = {
  version: 1,
  id: 'persona:tech-titans',
  title: 'Tech Titans',
  revision: 1,
  persona: {
    id: 'persona:tech-titans',
    label: 'Tech Titans',
    quote: 'Always on the latest gear.',
    segment: 'tech-titans',
    goals: [],
    frustrations: [],
    jobIds: [],
  },
  signalValues: {
    'attitude-tech-always-connected': 0.85,
  },
};

describe('hydrateCharacterSignalsFromDimensions', () => {
  it('joins AXM dimensions with Character values', () => {
    const hydrated = hydrateCharacterSignalsFromDimensions(basePcm, [
      {
        id: 'attitude-tech-always-connected',
        category: 'attitude',
        group: 'tech',
        label: 'Always connected',
        unit: 'ratio',
        source: 'research',
      },
    ]);
    expect(hydrated.signals).toHaveLength(1);
    expect(hydrated.signals?.[0]).toMatchObject({
      id: 'signal:tech-titans-attitude-tech-always-connected',
      characterId: 'persona:tech-titans',
      value: 0.85,
      label: 'Always connected',
    });
  });
});
