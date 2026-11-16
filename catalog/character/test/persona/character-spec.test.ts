import { describe, expect, it } from 'vitest';

import { characterFromJSON, characterToJSON } from '../../src/contract/persona/contract/json.js';
import { parseCharacter } from '../../src/contract/persona/schemas/character.schema.js';
import { CHARACTER_SPEC_VERSION, characterSpecVersion } from '../../src/contract/persona/types/character-spec.js';

const persona = {
  id: 'persona:a',
  label: 'A',
  quote: 'x',
  goals: [],
  frustrations: [],
  segment: 'general',
};

const job = {
  id: 'job:1',
  text: 'Finish the task',
  when: 'I open the product',
  want: 'to finish quickly',
  so: 'I can move on',
};

describe('CharacterSpec', () => {
  it('defaults spec version when omitted', () => {
    const character = parseCharacter({
      id: 'persona:a',
      title: 'A',
      revision: 1,
      persona,
      jobs: [job],
    });
    expect(character.version).toBe(CHARACTER_SPEC_VERSION);
    expect(characterSpecVersion(character)).toBe(1);
  });

  it('accepts characterSpec on disk alias', () => {
    const character = parseCharacter({
      characterSpec: 1,
      id: 'persona:a',
      title: 'A',
      revision: 1,
      persona,
      jobs: [job],
    });
    expect(character.version).toBe(1);
  });

  it('rejects conflicting characterSpec and version', () => {
    expect(() =>
      parseCharacter({
        characterSpec: 1,
        version: 2,
        id: 'persona:a',
        title: 'A',
        revision: 1,
        persona,
        jobs: [job],
      }),
    ).toThrow(/must agree/);
  });

  it('characterToJSON always includes document.version (spec)', () => {
    const json = characterToJSON(
      parseCharacter({
        id: 'persona:a',
        title: 'A',
        revision: 3,
        persona,
        jobs: [job],
      }),
    );
    const doc = json.document as Record<string, unknown>;
    expect(doc.version).toBe(1);
    expect(doc.revision).toBe(3);
    expect(characterFromJSON(json).revision).toBe(3);
  });
});
