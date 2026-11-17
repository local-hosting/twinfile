import { describe, expect, it } from 'vitest';

import {
  allocateUniqueCharacterId,
  buildCharacterIdSlug,
} from '../../../src/contract/character/persona/character-instance-id.js';
import { segmentIdFromCharacterSegment } from '../../../src/contract/character/persona/segment-id-from-character.js';

describe('segmentIdFromCharacterSegment', () => {
  it('normalizes segment refs', () => {
    expect(segmentIdFromCharacterSegment('urban-commuter')).toBe('urban-commuter');
    expect(segmentIdFromCharacterSegment('segment:urban-commuter')).toBe('urban-commuter');
    expect(segmentIdFromCharacterSegment(undefined)).toBe('default');
  });
});

describe('buildCharacterIdSlug', () => {
  it('joins name and customer type', () => {
    expect(
      buildCharacterIdSlug({
        name: 'Maya Chen',
        customerTypeSlug: 'urban-commuter',
      }),
    ).toBe('maya-chen-urban-commuter');
  });
});

describe('allocateUniqueCharacterId', () => {
  it('suffixes when base is taken', () => {
    const taken = new Set(['maya-commuter']);
    expect(allocateUniqueCharacterId('maya-commuter', (id) => taken.has(id))).toBe(
      'maya-commuter-2',
    );
  });
});
