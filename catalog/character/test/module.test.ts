import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile-core';
import { describe, expect, it } from 'vitest';

import { headFile, kind, module } from '../src/index.js';

const exampleDir = join(resolveTypeExamplesRoot('character', resolveTwinfileRoot()), 'shop-greeter');

describe('@local-hosting/twinfile-character', () => {
  it('exports TwinTypeModule with PCM wire', () => {
    expect(kind).toBe('character');
    expect(headFile).toBe('Character.yaml');
    expect(module.headFile).toBe('Character.yaml');
  });

  it('builds the shop-greeter example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('shop-greeter');
  });
});