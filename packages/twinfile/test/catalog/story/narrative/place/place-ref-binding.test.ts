import { describe, expect, it } from 'vitest';

import { validateStoryNarrativeScenes } from '../../../../../src/catalog/story/contract/narrative/contract/validate-story-scenes.js';
import {
  mergePlaceMountsByPlaceRef,
  minimalPlaceMount,
} from '../../../../../src/catalog/story/contract/narrative/place/minimal-place-mount.js';
import {
  findScenePlaceRefsOutsidePlaceMounts,
  resolveSceneSpaceId,
} from '../../../../../src/catalog/story/contract/narrative/place/place-mount-catalog.js';
import { placeMountFromPlaceRef } from '../../../../../src/catalog/story/contract/narrative/place/place-mount-from-place-ref.js';
import { parseStory } from '../../../../../src/catalog/story/contract/narrative/schemas/story-narrative.schema.js';

const arena = {
  ...minimalPlaceMount({ placeRef: 'twinfile/place/arena:2.0.0', title: 'Arena' }),
  spaceIds: ['space:gate'],
  defaultSpaceId: 'space:gate',
};

function samWithScenePlace(scenePlaceRef: string) {
  return parseStory({
    id: 'story:board:1',
    title: 'Board',
    revision: 1,
    characters: [{ characterId: 'persona:fan', primary: true }],
    places: [{ placeRef: 'twinfile/place/arena:2.0.0' }],
    arcTemplate: {
      id: 'arc:gate',
      label: 'Gate',
      kind: 'man_in_a_hole',
      acts: [
        { id: 'exposition', label: 'Setup', order: 0 },
        { id: 'denouement', label: 'Resolution', order: 1 },
      ],
    },
    scenes: [
      {
        id: 'scene:gate',
        label: 'Gate',
        order: 0,
        actId: 'exposition',
        characterIds: ['persona:fan'],
        placeRef: scenePlaceRef,
      },
      {
        id: 'scene:seat',
        label: 'Seat',
        order: 1,
        actId: 'denouement',
        characterIds: ['persona:fan'],
        placeRef: 'twinfile/place/arena:2.0.0',
      },
    ],
    binding: {
      characterId: 'persona:fan',
      journeyId: 'journey:gate',
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 0,
    },
  });
}

describe('Story place binding by placeRef', () => {
  it('matches scene placeRef to story.places on kind and name across tags', () => {
    expect(validateStoryNarrativeScenes(samWithScenePlace('twinfile/arena:1.2.0'))).toEqual({ ok: true });
  });

  it('flags a scene placeRef that is not on story.places', () => {
    const result = validateStoryNarrativeScenes(samWithScenePlace('twinfile/place/shop:1.0.0'));
    expect(result.ok).toBe(false);
  });

  it('rejects story.places rows without a valid placeRef', () => {
    expect(() =>
      parseStory({ ...samWithScenePlace('twinfile/arena:1.2.0'), places: [{ placeRef: 'venue:arena' }] }),
    ).toThrow();
  });

  it('resolves scene space and stray refs against mounts across tags', () => {
    expect(resolveSceneSpaceId({ placeRef: 'twinfile/arena:1.2.0' }, [arena])).toBe('space:gate');
    expect(
      findScenePlaceRefsOutsidePlaceMounts(
        samWithScenePlace('twinfile/arena:1.2.0').scenes ?? [],
        [arena],
      ),
    ).toEqual([]);
  });
});

describe('place mounts without a published unit', () => {
  it('synthesizes a placeRef from a Character place id', () => {
    const mount = placeMountFromPlaceRef({ id: 'downtown', label: 'Downtown', lat: 1, lon: 2 });
    expect(mount.placeRef).toBe('twinfile/place/downtown:0.0.0');
  });

  it('merges mounts for the same place across tags', () => {
    const anchor = minimalPlaceMount({ placeRef: 'twinfile/arena:1.0.0', lat: 1, lon: 2 });
    expect(mergePlaceMountsByPlaceRef([anchor, arena])).toEqual([arena]);
  });
});
