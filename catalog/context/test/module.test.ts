import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@doppler-group/twinfile-core';
import { describe, expect, it } from 'vitest';

import { kind, module } from '../src/index.js';

const examplesRoot = resolveTypeExamplesRoot('context', resolveTwinfileRoot());

describe('@doppler-group/twinfile-context', () => {
  it('exports the context module', () => {
    expect(kind).toBe('context');
    expect(module.kind).toBe('context');
  });

  it('builds every context example head', async () => {
    const ids = readdirSync(examplesRoot).filter((name) => !name.startsWith('.') && name !== 'README.md');
    expect(ids.length).toBeGreaterThan(1);
    for (const id of ids) {
      const built = await module.build(join(examplesRoot, id), {});
      expect(built.ok, id).toBe(true);
      if (built.ok) {
        expect(built.value.head.id).toBe(id);
        expect(built.value.head.kind).toBe('context');
      }
    }
  });

  it('rejects a head with the wrong kind', () => {
    expect(module.parse({ kind: 'place', id: 'x' }).ok).toBe(false);
  });
});
