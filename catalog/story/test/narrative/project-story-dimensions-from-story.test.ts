import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStory } from '../../src/contract/narrative/contract/load-story.js';
import { compileStory } from '../../src/contract/narrative/contract/compile-story-narrative.js';
import { projectStoryDimensionsFromStory } from '../../src/contract/narrative/project/project-story-dimensions-from-story.js';

const exampleStoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../example/commute-run',
);

describe('projectStoryDimensionsFromStory', () => {
  it('projects who/what/where/when from an example Story episode', () => {
    const { story: loaded } = loadStory(exampleStoryRoot);
    const compiled = compileStory({ story: loaded, force: true });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const dimensions = projectStoryDimensionsFromStory({
      story: compiled.story,
      journeyPace: 'medium',
      random: () => 0.5,
    });

    expect(dimensions.specVersion).toBe('1.0');
    expect(dimensions.who.characterId).toBeTruthy();
    expect(dimensions.what.storyId).toBe(loaded.id);
    expect(dimensions.where.placeRefs.length).toBeGreaterThan(0);
    expect(dimensions.when.simulationEpochStart).toBeTruthy();
    expect(dimensions.when.storyArc?.touchpointSchedule.length).toBeGreaterThan(0);
  });
});
