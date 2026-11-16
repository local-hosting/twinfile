import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { resolveAuditExamplesRoot, resolveTwinfilePackRoot } from '../src/paths/resolve-examples-root.js';

describe('resolveAuditExamplesRoot', () => {
  it('finds osc-twinfile pack root from a nested unit path', () => {
    const oscRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../../osc-stores/osc-twinfile');
    const story = join(oscRoot, 'story/spectrum-tech-titans-wearables');
    const pack = resolveTwinfilePackRoot(story);
    expect(pack).toBe(oscRoot);
    expect(resolveAuditExamplesRoot(story)).toBe(oscRoot);
  });
});