import { describe, expect, it } from 'vitest';

import type { TwinfileLoroMap } from '@local-hosting/twinfile-core/loro';

import { CharacterBundle } from '../../src/contract/character/contract/character-document.js';
import type { Character } from '../../src/contract/character/types/character.js';

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
};

function memoryLoroMap(initial: Record<string, unknown> = {}): TwinfileLoroMap {
  const entries = new Map<string, unknown>(Object.entries(initial));
  return {
    get(key: string) {
      return entries.has(key) ? entries.get(key) : null;
    },
    set(key: string, value: unknown) {
      entries.set(key, value);
    },
    delete(key: string) {
      return entries.delete(key);
    },
    has(key: string) {
      return entries.has(key);
    },
    keys() {
      return [...entries.keys()];
    },
  };
}

describe('CharacterBundle loro map I/O', () => {
  it('exports onto a host map and imports the class back', () => {
    const map = memoryLoroMap();
    CharacterBundle.from(sample).export(map);

    expect(map.get('document')).toMatchObject({ id: 'persona:rider', title: 'Rider' });
    expect(map.get('persona')).toMatchObject({ label: 'Rider' });

    const restored = CharacterBundle.import(map);
    expect(restored.value.id).toBe('persona:rider');
    expect(restored.value.persona.label).toBe('Rider');
    expect(restored.value.persona.jobIds).toEqual(['job:commute']);
  });
});
