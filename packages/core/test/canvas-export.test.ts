import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { canvasEntitiesFromProjectBundle } from '../src/canvas/export-project-entities.js';

const twinfileRoot = fileURLToPath(new URL('../../..', import.meta.url));

describe('canvasEntitiesFromProjectBundle', () => {
  it('fills panel rows for golden example ids', () => {
    const root = process.env.TF_TWINFILE_ROOT?.trim() || twinfileRoot;
    const out = canvasEntitiesFromProjectBundle(root);
    expect(out.place.length).toBeGreaterThan(5);
    expect(out.story.length).toBeGreaterThan(5);
    expect(out.place.some((r) => r.id === 'shop')).toBe(true);
    expect(out.entityRefs.some((r) => r.ref === 'twinfile/place/shop')).toBe(true);
  });
});