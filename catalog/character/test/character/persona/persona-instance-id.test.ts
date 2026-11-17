import { describe, expect, it } from 'vitest';

import {
  allocateUniquePersonaId,
  buildPersonaIdSlug,
} from '../../../src/contract/character/persona/persona-instance-id.js';
import { segmentIdFromPersonaSegment } from '../../../src/contract/character/persona/segment-id-from-persona.js';

describe('segmentIdFromPersonaSegment', () => {
  it('normalizes segment refs', () => {
    expect(segmentIdFromPersonaSegment('urban-commuter')).toBe('urban-commuter');
    expect(segmentIdFromPersonaSegment('segment:urban-commuter')).toBe('urban-commuter');
    expect(segmentIdFromPersonaSegment(undefined)).toBe('default');
  });
});

describe('buildPersonaIdSlug', () => {
  it('joins name and customer type', () => {
    expect(
      buildPersonaIdSlug({
        name: 'Maya Chen',
        customerTypeSlug: 'urban-commuter',
      }),
    ).toBe('maya-chen-urban-commuter');
  });
});

describe('allocateUniquePersonaId', () => {
  it('suffixes when base is taken', () => {
    const taken = new Set(['maya-commuter']);
    expect(allocateUniquePersonaId('maya-commuter', (id) => taken.has(id))).toBe(
      'maya-commuter-2',
    );
  });
});
