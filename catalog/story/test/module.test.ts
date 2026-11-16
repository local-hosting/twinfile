import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@doppler-group/twinfile-core';
import { describe, expect, it } from 'vitest';

import { headFile, kind, module } from '../src/twin-module.js';

const exampleDir = join(resolveTypeExamplesRoot('story', resolveTwinfileRoot()), 'airport-operations');

describe('@doppler-group/twinfile-story', () => {
  it('exports TwinTypeModule with SAM wire', () => {
    expect(kind).toBe('story');
    expect(headFile).toBe('Story.yaml');
    expect(module.kind).toBe('story');
  });

  it('builds the airport-operations example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('airport-operations');
  });
});