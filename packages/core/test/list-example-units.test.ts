import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { listExampleUnitIds } from '../src/project/list-example-units.js';

const twinfileRoot = fileURLToPath(new URL('../../..', import.meta.url));

describe('listExampleUnitIds', () => {
  it('lists golden twin heads and skips non-unit folders', () => {
    const root = process.env.TF_TWINFILE_ROOT?.trim() || twinfileRoot;
    const places = listExampleUnitIds('place', root);
    expect(places).toContain('airport');
    expect(places).toContain('shop');
    expect(places).not.toContain('mcp');
    expect(listExampleUnitIds('story', root)).toContain('airport-operations');
  });
});
