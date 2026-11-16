import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile-core';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../src/index.js';

const exampleDir = join(resolveTypeExamplesRoot('context', resolveTwinfileRoot()), 'wireless-retail');

describe('@local-hosting/twinfile-context', () => {
  it('exports the context module', () => {
    expect(kind).toBe('context');
    expect(module.kind).toBe('context');
  });

  it('builds the wireless-retail example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('wireless-retail');
  });

  it('rejects a head with the wrong kind', () => {
    expect(module.parse({ kind: 'place', id: 'x' }).ok).toBe(false);
  });
});
