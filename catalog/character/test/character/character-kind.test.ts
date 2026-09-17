import { describe, expect, it } from 'vitest';
import {
  CharacterKindSchema,
  CharacterPersonaSchema,
} from '../../src/contract/character/schemas/character-persona.schema.js';

describe('character.kind (narrative | persona)', () => {
  it('accepts narrative and persona', () => {
    expect(CharacterKindSchema.parse('narrative')).toBe('narrative');
    expect(CharacterKindSchema.parse('persona')).toBe('persona');
  });

  it('rejects unknown kinds', () => {
    expect(() => CharacterKindSchema.parse('human')).toThrow();
  });

  it('allows optional kind on character persona fields', () => {
    const narrative = CharacterPersonaSchema.parse({
      id: 'rashid',
      label: 'Rashid',
      quote: 'Quest on.',
      kind: 'narrative',
      role: 'hero',
      segment: 'expo-cast',
    });
    expect(narrative.kind).toBe('narrative');

    const persona = CharacterPersonaSchema.parse({
      id: 'business-traveler',
      label: 'Business Traveler',
      quote: 'I have forty minutes between meetings.',
      kind: 'persona',
      role: 'visitor',
      segment: 'business',
    });
    expect(persona.kind).toBe('persona');
  });
});
