import { describe, expect, it } from 'vitest';
import type { Character } from '@doppler-group/twinfile-character/persona';

import { buildStoryCatalogMenu, storyCatalogMenuHasEpisodes } from '../../src/contract/narrative/story-catalog/build-story-catalog-menu.js';
import { compileStoriesForCatalog } from '../../src/contract/narrative/story-catalog/compile-stories-for-catalog.js';
import { resolveStoryEpisode } from '../../src/contract/narrative/story-catalog/resolve-story-episode.js';
import { placeMountFixture } from './helpers/place-mount-fixture.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

const character: Character = {
  version: 1,
  id: 'character:rider',
  revision: 1,
  title: 'Rider',
  persona: {
    id: 'persona:rider',
    label: 'Rider',
    quote: 'q',
    goals: [],
    frustrations: [],
    segment: 'rider',
    jobIds: [],
  },
  jobs: [],
  journeys: [
    {
      id: 'journey:fixture',
      label: 'Fixture',
      personaId: 'persona:rider',
      phases: [
        {
          id: 'phase:a',
          label: 'A',
          order: 0,
          jobIds: [],
          touchpointIds: ['touchpoint:a'],
          emotions: {},
        },
      ],
    },
  ],
};

const curbsideMount = placeMountFixture({
  placeRef: 'twinfile/place/curbside:0.0.0',
  title: 'Curbside',
  spaceIds: ['space:curb'],
});

describe('story catalog (org models)', () => {
  it('builds menu from mounted Character / Story / place mounts', () => {
    const story = storyboardStoryFixture();
    const menu = buildStoryCatalogMenu({
      characters: [character],
      placeMounts: [curbsideMount],
      stories: [story],
    });
    expect(storyCatalogMenuHasEpisodes(menu)).toBe(true);
    expect(menu.episodes[0]?.journeyId).toBe('journey:fixture');
  });

  it('resolves episode by id', () => {
    const story = storyboardStoryFixture();
    const mount = resolveStoryEpisode({
      stories: [story],
      characters: [character],
      selection: { episodeId: story.id },
    });
    expect(mount.journey.id).toBe('journey:fixture');
  });

  it('compileStoriesForCatalog fills episodeArc', () => {
    const story = storyboardStoryFixture();
    const [compiled] = compileStoriesForCatalog({
      characters: [character],
      placeMounts: [curbsideMount],
      stories: [story],
    });
    expect(compiled.episodeArc?.touchpointSchedule.length).toBeGreaterThan(0);
  });
});
