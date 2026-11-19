import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadChanceCtor } from '../../../../../src/contract/character/story/load-chance-ctor.js';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '../../../src/contract/character/story');

describe('loadChanceCtor', () => {
  it('does not default-import chance (Vite CJS interop)', () => {
    const rng = readFileSync(join(storyDir, 'character-instance-rng.ts'), 'utf8');
    const loader = readFileSync(join(storyDir, 'load-chance-ctor.ts'), 'utf8');
    expect(rng).not.toMatch(/^import\s+Chance\s+from\s+['"]chance['"]/m);
    expect(loader).not.toMatch(/^import\s+Chance\s+from\s+['"]chance['"]/m);
    expect(loader).toMatch(/^import\s+\*\s+as\s+ChanceNamespace\s+from\s+['"]chance['"]/m);
  });

  it('returns a constructible Chance from the CJS/UMD module', () => {
    const Chance = loadChanceCtor();
    const chance = new Chance('interop-seed');
    expect(typeof chance.floating).toBe('function');
    expect(chance.floating({ min: 0, max: 1, fixed: 10 })).toBeGreaterThanOrEqual(0);
  });
});
