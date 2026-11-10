import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../../../src/catalog/event/index.js';

const exampleDir = join(resolveTypeExamplesRoot('event', resolveTwinfileRoot()), 'flood');

describe('@local-hosting/twinfile/event', () => {
  it('exports the event module', () => {
    expect(kind).toBe('event');
    expect(module.kind).toBe('event');
  });

  it('builds the flood example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('flood');
  });

  it('rejects a head with the wrong kind', () => {
    expect(module.parse({ kind: 'place', id: 'x' }).ok).toBe(false);
  });
});
