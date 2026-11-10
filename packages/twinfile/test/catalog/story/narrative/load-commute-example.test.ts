import { describe, expect, it } from 'vitest';

import { compileStory } from '../../../../src/catalog/story/contract/narrative/contract/compile-story-narrative.js';
import { loadStory } from '../../../../src/catalog/story/contract/narrative/contract/load-story.js';

describe('example/commute-run', () => {
  it('loads scenes from disk and compiles touchpoint sequence', () => {
    const { story } = loadStory(new URL('../example/commute-run', import.meta.url).pathname);
    expect(story.scenes?.length).toBe(3);
    expect(story.arcTemplate?.acts.length).toBeGreaterThan(0);

    const result = compileStory({ story });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.story.episodeArc?.objectiveTouchpointIds).toEqual([
      'touchpoint:rider-open-home',
      'touchpoint:rider-set-dest',
      'touchpoint:rider-confirm-dest',
      'touchpoint:rider-live-map',
    ]);
  });
});
