import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../../../src/index.js';

const exampleDir = join(resolveTypeExamplesRoot('character', resolveTwinfileRoot()), 'shop-greeter');

describe('@local-hosting/twinfile/character', () => {
  it('exports TwinTypeModule with Character wire', () => {
    expect(kind).toBe('character');
  });

  it('builds the shop-greeter example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('shop-greeter');
  });
});