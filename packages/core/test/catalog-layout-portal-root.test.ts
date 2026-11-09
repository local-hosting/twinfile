import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveCharacterCatalogRoot, resolveTwinfileRoot } from '../src/paths/catalog-layout.js';
import { testTwinfileRoot } from './catalog-test-roots.js';

const monorepoRoot = testTwinfileRoot(import.meta.dirname);
const prevEnv = process.env.TF_TWINFILE_ROOT;

afterEach(() => {
  if (prevEnv === undefined) delete process.env.TF_TWINFILE_ROOT;
  else process.env.TF_TWINFILE_ROOT = prevEnv;
});

describe('resolveTwinfileRoot via portal-like symlink', () => {
  it('realpath-walks nested node_modules portals into the twinfile monorepo', () => {
    delete process.env.TF_TWINFILE_ROOT;

    const nest = join(
      tmpdir(),
      `twinfile-portal-root-${process.pid}-${Date.now()}`,
      'node_modules',
      '@local-hosting',
    );
    mkdirSync(nest, { recursive: true });
    const portal = join(nest, 'twinfile-character');
    symlinkSync(join(monorepoRoot, 'catalog', 'character'), portal);

    const root = resolveTwinfileRoot(portal);
    expect(root).toBe(monorepoRoot);
    expect(resolveCharacterCatalogRoot(portal)).toBe(join(monorepoRoot, 'catalog', 'character', 'libs'));
  });

  it('honors TF_TWINFILE_ROOT over a bad seed', () => {
    const fake = join(tmpdir(), `twinfile-env-root-${process.pid}`);
    mkdirSync(fake, { recursive: true });
    writeFileSync(join(fake, 'package.json'), '{"name":"fake"}');
    process.env.TF_TWINFILE_ROOT = monorepoRoot;

    expect(resolveTwinfileRoot(fake)).toBe(monorepoRoot);
  });
});
