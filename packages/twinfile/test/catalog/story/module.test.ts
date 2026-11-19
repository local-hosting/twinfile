import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../../../src/twin-module.js';

const exampleDir = join(resolveTypeExamplesRoot('story', resolveTwinfileRoot()), 'airport-operations');

describe('@local-hosting/twinfile/story', () => {
  it('exports TwinTypeModule with Story wire', () => {
    expect(kind).toBe('story');
    expect(module.kind).toBe('story');
  });

  it('builds the airport-operations example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('airport-operations');
  });
});