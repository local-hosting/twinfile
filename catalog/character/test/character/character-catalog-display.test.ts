import { describe, expect, it } from 'vitest';
import {
  characterCatalogId,
  characterCatalogLabel,
  characterCatalogSegment,
} from '../../src/contract/character/contract/character-catalog-display.js';
import { resolveCharacterPersonaDisplayName } from '../../src/contract/character/persona/resolve-persona-display-name.js';
import * as pcmEntry from '../../src/contract/character/index.js';
import type { Character } from '../../src/contract/character/types/character.js';

const sample: Character = {
  id: 'persona:rider',
  title: 'Rider title',
  version: 1,
  revision: 1,
  persona: {
    id: 'persona:rider',
    label: 'Alex Rider',
    segment: 'segment:commute',
    quote: '',
    goals: [],
    frustrations: [],
    jobIds: [],
  },
};

describe('character catalog display helpers', () => {
  it('characterCatalogId prefers persona.id', () => {
    expect(characterCatalogId(sample)).toBe('persona:rider');
  });

  it('characterCatalogLabel prefers persona label', () => {
    expect(characterCatalogLabel(sample)).toBe('Alex Rider');
  });

  it('characterCatalogSegment reads persona segment', () => {
    expect(characterCatalogSegment(sample)).toBe('segment:commute');
  });

  it('resolveCharacterPersonaDisplayName honors override', () => {
    expect(resolveCharacterPersonaDisplayName(sample, 'Custom')).toBe('Custom');
    expect(resolveCharacterPersonaDisplayName(sample)).toBe('Alex Rider');
  });

  it('exports resolveCharacterPersonaDisplayName from the character entry', () => {
    expect(pcmEntry.resolveCharacterPersonaDisplayName).toBe(resolveCharacterPersonaDisplayName);
  });
});
