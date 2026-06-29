import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile-core';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../src/index.js';

const exampleDir = join(resolveTypeExamplesRoot('resource', resolveTwinfileRoot()), 'greeter-kiosk');

describe('@local-hosting/twinfile-resource', () => {
  it('exports the resource module', () => {
    expect(kind).toBe('resource');
    expect(module.kind).toBe('resource');
  });

  it('builds the greeter-kiosk example head', async () => {
    const built = await module.build(exampleDir, {});
    expect(built.ok && built.value.head.id).toBe('greeter-kiosk');
  });

  it('rejects a head with the wrong kind', () => {
    expect(module.parse({ kind: 'character', id: 'x' }).ok).toBe(false);
  });
});