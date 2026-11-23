import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CORE_PACKAGE } from '../../src/core/core/core-package-meta.js';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('core-package-meta', () => {
  it('does not import Node builtins (browser-safe)', () => {
    const source = readFileSync(
      join(packageRoot, 'src/core/core/core-package-meta.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/from ['"]node:/);
    expect(source).not.toMatch(/from ['"]node:fs['"]/);
    expect(source).not.toMatch(/from ['"]node:path['"]/);
  });

  it('matches published package name and version', () => {
    const pkg = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8'),
    ) as { name: string; version: string };
    expect(CORE_PACKAGE.name).toBe(pkg.name);
    expect(CORE_PACKAGE.version).toBe(pkg.version);
  });
});