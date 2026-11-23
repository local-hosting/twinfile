import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../src');

const browserHashModules = [
  'core/build/digest.ts',
  'core/build/digest-file.ts',
  'simulator/timeline/schedule.ts',
  'simulator/timeline/simulate-feed.ts',
] as const;

describe('digest browser boundary', () => {
  it('browser-reachable hash modules do not import node:crypto', () => {
    for (const rel of browserHashModules) {
      const source = readFileSync(join(srcRoot, rel), 'utf8');
      expect(source, rel).not.toMatch(/node:crypto/);
    }
  });
});