import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { resolveExamplePlace } from '../src/ref/resolve-example-place.js';
import { loadTwinLocalMap } from '../src/ref/twin-local-map.js';
import { testExamplesRoot } from './test-examples-root.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('resolveExamplePlace', () => {
  it('loads shop from twinfile ref', () => {
    const resolved = resolveExamplePlace('twinfile/shop:0.2.0', { examplesRoot });
    expect(resolved.twinfile.id).toBe('shop');
    expect(resolved.layers.length).toBeGreaterThan(0);
  });

  it('lists example refs', () => {
    const map = loadTwinLocalMap(examplesRoot);
    expect([...map.keys()].some((ref) => ref.includes('twinfile/shop:'))).toBe(true);
  });
});
