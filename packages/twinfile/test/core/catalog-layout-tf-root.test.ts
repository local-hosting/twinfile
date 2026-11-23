import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolvePlaceExamplesCatalogRoot, resolveTwinfileRoot } from '@local-hosting/twinfile';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('resolveTwinfileRoot (TF_TWINFILE_ROOT)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes git repo root to packages/twinfile for place examples', () => {
    const gitRoot = join(pkgRoot, '..', '..');
    if (!existsSync(join(gitRoot, 'packages', 'twinfile', 'package.json'))) {
      return;
    }
    vi.stubEnv('TF_TWINFILE_ROOT', gitRoot);
    const examples = resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot());
    expect(examples).toBe(join(pkgRoot, 'src', 'catalog', 'place', 'examples'));
    expect(existsSync(join(examples, 'base-linear'))).toBe(true);
  });
});