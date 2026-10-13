import { describe, expect, it } from 'vitest';

import { STORY_ARC_KINDS } from '../../../../src/contract/narrative/types/story-arc-kind.js';
import { defaultActsForStoryArcKind } from '../../../../src/contract/narrative/story-arc/write-practice-presets.js';

describe('Write Practice story arc kinds', () => {
  it('defines six arc kinds with default beat rails', () => {
    expect(STORY_ARC_KINDS).toHaveLength(6);
    for (const kind of STORY_ARC_KINDS) {
      const acts = defaultActsForStoryArcKind(kind);
      expect(acts.length).toBeGreaterThan(0);
      expect(acts[0]?.id).toBe('exposition');
    }
  });
});
