import { describe, expect, it } from 'vitest';
import type { Journey } from '@local-hosting/twinfile-character/pcm';

import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';
import { validateSAMAssociations } from '../../src/contract/narrative/contract/validate-sam-associations.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

const journey = {
  id: 'journey:fixture',
  label: 'Commute',
  personaId: 'persona:rider',
  phases: [
    {
      id: 'p1',
      label: 'Plan',
      order: 0,
      jobIds: ['need:1'],
      touchpointIds: ['touchpoint:a'],
      emotions: { band: 'mid' },
    },
    {
      id: 'p2',
      label: 'Ride',
      order: 1,
      jobIds: ['need:1'],
      touchpointIds: ['touchpoint:b'],
      emotions: { band: 'mid' },
    },
  ],
} as Journey;

describe('SAM associations', () => {
  it('defaults characters from binding.pcmId on parse', () => {
    const { characters: _characters, ...body } = storyboardSamFixture();
    const sam = parseSAM(body);
    expect(sam.characters).toEqual([{ pcmId: 'persona:rider', primary: true }]);
  });

  it('accepts multiple characters and places', () => {
    const sam = parseSAM({
      ...storyboardSamFixture(),
      characters: [
        { pcmId: 'persona:rider', primary: true },
        { pcmId: 'persona:driver', role: 'counterpart' },
      ],
      places: [{ placeRef: 'twinfile/place/hub:0.0.0' }, { placeRef: 'twinfile/place/store:0.0.0' }],
    });
    expect(sam.places).toHaveLength(2);
    const check = validateSAMAssociations(sam, {
      journey,
      knownPcmIds: ['persona:rider', 'persona:driver'],
      knownPlaceRefs: ['twinfile/place/hub:0.0.0', 'twinfile/place/store:0.0.0'],
    });
    expect(check.ok).toBe(true);
  });

  it('rejects unknown pcm or place mounts', () => {
    const sam = parseSAM({
      ...storyboardSamFixture(),
      places: [{ placeRef: 'twinfile/place/missing:0.0.0' }],
    });
    const check = validateSAMAssociations(sam, {
      journey,
      knownPcmIds: ['persona:rider'],
      knownPlaceRefs: ['twinfile/place/hub:0.0.0'],
    });
    expect(check.ok).toBe(false);
    if (check.ok) return;
    expect(check.issues.join(' ')).toMatch(/unknown placeRef/);
  });
});
