import { describe, expect, it } from 'vitest';

import {
  createCharacterInstanceChance,
  resolveCharacterInstanceRandom,
} from '../../../../../src/contract/character/story/character-instance-rng.js';

describe('character-instance-rng', () => {
  it('constructs Chance without relying on a CJS default export binding', () => {
    const chance = createCharacterInstanceChance('river-watch-seed');
    expect(typeof chance.floating).toBe('function');
    const a = chance.floating({ min: 0, max: 1, fixed: 10 });
    const b = createCharacterInstanceChance('river-watch-seed').floating({
      min: 0,
      max: 1,
      fixed: 10,
    });
    expect(a).toBe(b);
  });

  it('resolves a seeded sampler via Chance', () => {
    const random = resolveCharacterInstanceRandom({ seed: 'river-watch-seed' });
    const first = random();
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
  });
});
