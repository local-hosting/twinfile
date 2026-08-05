import { describe, expect, it } from 'vitest';

import { validateSAMScenes } from '../../../src/contract/narrative/contract/validate-sam-scenes.js';
import {
  mergePlaceMountsByPlaceRef,
  minimalPlaceMount,
} from '../../../src/contract/narrative/place/minimal-place-mount.js';
import {
  findScenePlaceRefsOutsidePlaceMounts,
  resolveSceneSpaceId,
} from '../../../src/contract/narrative/place/place-mount-catalog.js';
import { placeMountFromPlaceRef } from '../../../src/contract/narrative/place/place-mount-from-place-ref.js';
import { parseSAM } from '../../../src/contract/narrative/schemas/sam.schema.js';

const arena = {
  ...minimalPlaceMount({ placeRef: 'twinfile/place/arena:2.0.0', title: 'Arena' }),
  spaceIds: ['space:gate'],
  defaultSpaceId: 'space:gate',
};

function samWithScenePlace(scenePlaceRef: string) {
  return parseSAM({
    id: 'story:board:1',
    title: 'Board',
    revision: 1,
    characters: [{ pcmId: 'persona:fan', primary: true }],
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
      pcmId: 'persona:fan',
      journeyId: 'journey:gate',
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 0,
    },
  });
}

describe('SAM place binding by placeRef', () => {
  it('matches scene placeRef to sam.places on kind and name across tags', () => {
    expect(validateSAMScenes(samWithScenePlace('twinfile/arena:1.2.0'))).toEqual({ ok: true });
  });

  it('flags a scene placeRef that is not on sam.places', () => {
    const result = validateSAMScenes(samWithScenePlace('twinfile/place/shop:1.0.0'));
    expect(result.ok).toBe(false);
  });

  it('rejects sam.places rows without a valid placeRef', () => {
    expect(() =>
      parseSAM({ ...samWithScenePlace('twinfile/arena:1.2.0'), places: [{ placeRef: 'venue:arena' }] }),
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
  it('synthesizes a placeRef from a PCM place id', () => {
    const mount = placeMountFromPlaceRef({ id: 'downtown', label: 'Downtown', lat: 1, lon: 2 });
    expect(mount.placeRef).toBe('twinfile/place/downtown:0.0.0');
  });

  it('merges mounts for the same place across tags', () => {
    const anchor = minimalPlaceMount({ placeRef: 'twinfile/arena:1.0.0', lat: 1, lon: 2 });
    expect(mergePlaceMountsByPlaceRef([anchor, arena])).toEqual([arena]);
  });
});
