import { describe, expect, it } from 'vitest';
import type { PCM } from '@local-hosting/twinfile-character/pcm';

import { buildSamStoryCatalogMenu, samStoryCatalogMenuHasEpisodes } from '../../src/contract/narrative/story-catalog/build-sam-story-catalog-menu.js';
import { compileSamsForCatalog } from '../../src/contract/narrative/story-catalog/compile-sams-for-catalog.js';
import { resolveSamEpisode } from '../../src/contract/narrative/story-catalog/resolve-sam-episode.js';
import { placeMountFixture } from './helpers/place-mount-fixture.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

const pcm: PCM = {
  version: 1,
  id: 'pcm:rider',
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
  venueKey: 'venue:curbside',
  title: 'Curbside',
  spaceIds: ['space:curb'],
});

describe('story catalog (org models)', () => {
  it('builds menu from mounted PCM / SAM / place mounts', () => {
    const sam = storyboardSamFixture();
    const menu = buildSamStoryCatalogMenu({
      pcms: [pcm],
      placeMounts: [curbsideMount],
      sams: [sam],
    });
    expect(samStoryCatalogMenuHasEpisodes(menu)).toBe(true);
    expect(menu.episodes[0]?.journeyId).toBe('journey:fixture');
  });

  it('resolves episode by id', () => {
    const sam = storyboardSamFixture();
    const mount = resolveSamEpisode({
      sams: [sam],
      pcms: [pcm],
      selection: { episodeId: sam.id },
    });
    expect(mount.journey.id).toBe('journey:fixture');
  });

  it('compileSamsForCatalog fills episodeArc', () => {
    const sam = storyboardSamFixture();
    const [compiled] = compileSamsForCatalog({
      pcms: [pcm],
      placeMounts: [curbsideMount],
      sams: [sam],
    });
    expect(compiled.episodeArc?.touchpointSchedule.length).toBeGreaterThan(0);
  });
});
