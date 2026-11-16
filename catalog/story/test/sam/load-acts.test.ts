import { describe, expect, it } from 'vitest';

import { loadSAM } from '../../src/contract/narrative/contract/load-sam.js';

describe('acts/ on disk', () => {
  it('merges acts/*.yml into arcTemplate', () => {
    const { sam } = loadSAM(new URL('../example/commute-run', import.meta.url).pathname);
    expect(sam.arcTemplate?.acts.length).toBeGreaterThanOrEqual(3);
    expect(sam.arcTemplate?.acts.map((row) => row.id)).toContain('exposition');
  });
});
