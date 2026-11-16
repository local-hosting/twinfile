import { describe, expect, it } from 'vitest';
import type { PCM } from '../../../src/contract/persona/types/pcm.js';
import {
  materializePcmStoryInstance,
  pickPcmInstanceCharacteristics,
} from '../../../src/contract/persona/story/materialize-pcm-story-instance.js';
const samplePcm: PCM = {
  version: 1,
  id: 'persona:rider',
  title: 'Rider',
  revision: 1,
  persona: {
    id: 'persona:rider',
    label: 'Rider',
    mindset: 'practical',
    traits: ['curious', 'patient', 'direct', 'warm'],
    quote: 'On time matters.',
    goals: [],
    frustrations: [],
    segment: 'commuter',
    jobIds: [],
  },
  jobs: [],
};

describe('materializePcmStoryInstance', () => {
  it('is deterministic for the same string seed (Chance)', () => {
    const first = materializePcmStoryInstance({
      pcm: samplePcm,
      pcmId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      seed: 'character:rider-urban-commuter-3',
    });
    const second = materializePcmStoryInstance({
      pcm: samplePcm,
      pcmId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      seed: 'character:rider-urban-commuter-3',
    });
    expect(first.characteristics.traits).toEqual(second.characteristics.traits);
    expect(first.characteristics.dailyRhythm).toEqual(second.characteristics.dailyRhythm);
  });

  it('uses custom displayName and seeds a small trait subset', () => {
    const instance = materializePcmStoryInstance({
      pcm: samplePcm,
      pcmId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      instanceId: 'maya-commute-1',
      seed: 42,
    });

    expect(instance.displayName).toBe('Maya');
    expect(instance.pcmId).toBe('persona:rider');
    expect(instance.instanceId).toBe('maya-commute-1');
    const traits = instance.characteristics.traits ?? [];
    expect(traits.length).toBeGreaterThan(0);
    expect(traits.length).toBeLessThanOrEqual(3);
    for (const trait of traits) {
      expect(samplePcm.persona.traits ?? []).toContain(trait);
    }
  });

  it('honors pcm.instanceVariation traitPickCount', () => {
    const pcm: PCM = {
      ...samplePcm,
      instanceVariation: { specVersion: '1.0', traitPickCount: 1, includeVoiceLine: false },
    };
    const row = pickPcmInstanceCharacteristics(pcm, () => 0.5);
    expect(row.traits?.length).toBe(1);
    expect(row.voiceLine).toBeUndefined();
  });

  it('is deterministic for the same random source', () => {
    const first = pickPcmInstanceCharacteristics(samplePcm, () => 0.42);
    const second = pickPcmInstanceCharacteristics(samplePcm, () => 0.42);
    expect(first.traits).toEqual(second.traits);
  });

  it('samples demographic bands from persona.demographic natively', () => {
    const pcm: PCM = {
      ...samplePcm,
      persona: {
        ...samplePcm.persona,
        demographic: {
          aspects: [
            { frameworkId: 'age', typeId: '18-34', label: '18-34', weight: 0.2 },
            { frameworkId: 'age', typeId: '55-plus', label: '55+', weight: 0.8 },
            { frameworkId: 'income', typeId: 'under-50k', label: 'Under $50k', weight: 1 },
          ],
        },
      },
    };
    const alwaysHigh = pickPcmInstanceCharacteristics(pcm, () => 0.99);
    expect(alwaysHigh.demographics?.age).toBe('55+');
    expect(alwaysHigh.demographics?.income).toBe('Under $50k');

    const fromSignals: PCM = {
      ...samplePcm,
      signals: [
        {
          id: 'signal:rider-demographic-age-18-34',
          personaId: 'persona:rider',
          category: 'demographic',
          group: 'age',
          label: '18-34',
          unit: 'percent',
          value: 100,
        },
      ],
    };
    const fromSignalBands = pickPcmInstanceCharacteristics(fromSignals, () => 0.1);
    expect(fromSignalBands.demographics?.age).toBe('18-34');
  });

  it('skips demographic sampling when includeDemographics is false', () => {
    const pcm: PCM = {
      ...samplePcm,
      instanceVariation: { specVersion: '1.0', includeDemographics: false },
      persona: {
        ...samplePcm.persona,
        demographic: {
          aspects: [{ frameworkId: 'age', typeId: '55-plus', label: '55+', weight: 1 }],
        },
      },
    };
    expect(pickPcmInstanceCharacteristics(pcm, () => 0.5).demographics).toBeUndefined();
  });
});
