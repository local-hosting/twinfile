import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkCatalogParent } from '../src/check/catalog-parent.js';

const twinfileRoot = resolve(import.meta.dirname, '../../..');

describe('checkCatalogParent', () => {
  it('accepts matching parent ref and id prefix', () => {
    const scenarioRoot = resolve(twinfileRoot, 'catalog/story/examples/arena-operations');
    expect(
      checkCatalogParent(scenarioRoot, {
        kind: 'scenario',
        id: 'arena-storm-at-halftime',
        name: 'Storm at halftime',
        from: '..',
        catalog: { parent: 'twinfile/arena:1.2.0' },
      }),
    ).toEqual([]);
  });

  it('rejects id prefix mismatch', () => {
    const errors = checkCatalogParent('/tmp/x', {
      kind: 'scenario',
      id: 'storm-at-halftime',
      name: 'Storm at halftime',
      catalog: { parent: 'twinfile/arena:1.2.0' },
    });
    expect(errors[0]?.code).toBe('E_CATALOG');
  });
});
