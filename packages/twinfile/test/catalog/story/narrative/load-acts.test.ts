import { describe, expect, it } from 'vitest';

import { loadStory } from '../../../../src/contract/narrative/contract/load-story.js';

describe('acts/ on disk', () => {
  it('merges acts/*.yml into arcTemplate', () => {
    const { story } = loadStory(new URL('../example/commute-run', import.meta.url).pathname);
    expect(story.arcTemplate?.acts.length).toBeGreaterThanOrEqual(3);
    expect(story.arcTemplate?.acts.map((row) => row.id)).toContain('exposition');
  });
});
