import { describe, expect, it } from 'vitest';

import {
  checkExpectsAgainstVocabulary,
  checkPlanRolesExact,
  checkPlaceRoleTags,
  loadEventRoleVocabulary,
} from '../src/check/event-role-vocabulary.js';

describe('event role vocabulary', () => {
  it('loads global roles including water-launch', () => {
    const vocab = loadEventRoleVocabulary();
    expect(vocab.get('shelter')?.kind).toBe('space');
    expect(vocab.get('water-launch')?.kind).toBe('marker');
    expect(vocab.has('put-in')).toBe(false);
  });

  it('rejects unknown expects keys', () => {
    const vocab = loadEventRoleVocabulary();
    const errors = checkExpectsAgainstVocabulary(
      { 'not-a-role': { kind: 'space', min: 1 } },
      vocab,
    );
    expect(errors.some((e) => e.code === 'E_ROLE_VOCAB')).toBe(true);
  });

  it('requires plan keys to match expects exactly', () => {
    const expects = { shelter: { kind: 'space', min: 1 } };
    const errors = checkPlanRolesExact({ shelter: ['s1'], extra: ['x'] }, expects);
    expect(errors.some((e) => e.code === 'E_ROLE_VOCAB')).toBe(true);
  });

  it('requires mapped rows to carry role tags', () => {
    const place = { spaces: [{ id: 's1', kind: 'room' }] };
    const errors = checkPlaceRoleTags(
      place,
      { shelter: { kind: 'space', min: 1 } },
      { shelter: ['s1'] },
    );
    expect(errors.some((e) => e.code === 'E_ROLE_TAG')).toBe(true);
  });
});
