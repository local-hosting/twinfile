import { describe, expect, it } from 'vitest';

import { compileSAM } from '../../src/contract/narrative/contract/compile-sam.js';
import { loadSAM } from '../../src/contract/narrative/contract/load-sam.js';

describe('example/commute-run', () => {
  it('loads scenes from disk and compiles touchpoint sequence', () => {
    const { sam } = loadSAM(new URL('../example/commute-run', import.meta.url).pathname);
    expect(sam.scenes?.length).toBe(3);
    expect(sam.arcTemplate?.acts.length).toBeGreaterThan(0);

    const result = compileSAM({ sam });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sam.episodeArc?.objectiveTouchpointIds).toEqual([
      'touchpoint:rider-open-home',
      'touchpoint:rider-set-dest',
      'touchpoint:rider-confirm-dest',
      'touchpoint:rider-live-map',
    ]);
  });
});
