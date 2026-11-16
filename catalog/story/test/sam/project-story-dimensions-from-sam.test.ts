import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSAM } from '../../src/contract/narrative/contract/load-sam.js';
import { compileSAM } from '../../src/contract/narrative/contract/compile-sam.js';
import { projectStoryDimensionsFromSam } from '../../src/contract/narrative/project/project-story-dimensions-from-sam.js';

const exampleSamRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../example/commute-run',
);

describe('projectStoryDimensionsFromSam', () => {
  it('projects who/what/where/when from an example SAM episode', () => {
    const { sam: loaded } = loadSAM(exampleSamRoot);
    const compiled = compileSAM({ sam: loaded, force: true });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const dimensions = projectStoryDimensionsFromSam({
      sam: compiled.sam,
      journeyPace: 'medium',
      random: () => 0.5,
    });

    expect(dimensions.specVersion).toBe('1.0');
    expect(dimensions.who.pcmId).toBeTruthy();
    expect(dimensions.what.samEpisodeId).toBe(loaded.id);
    expect(dimensions.what.journeyId).toBe(loaded.binding.journeyId);
    expect(dimensions.where.placeRefs.length).toBeGreaterThan(0);
    expect(dimensions.when.simulationEpochStart).toBeTruthy();
    expect(dimensions.when.storyArc?.touchpointSchedule.length).toBeGreaterThan(0);
  });
});
