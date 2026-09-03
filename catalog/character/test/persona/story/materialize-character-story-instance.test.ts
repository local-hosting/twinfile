import { describe, expect, it } from 'vitest';
import type { Character } from '../../../src/contract/persona/types/character.js';
import {
  materializeCharacterStoryInstance,
  pickCharacterInstanceCharacteristics,
} from '../../../src/contract/persona/story/materialize-character-story-instance.js';
const sampleCharacter: Character = {
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

describe('materializeCharacterStoryInstance', () => {
  it('is deterministic for the same string seed (Chance)', () => {
    const first = materializeCharacterStoryInstance({
      character: sampleCharacter,
      characterId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      seed: 'character:rider-urban-commuter-3',
    });
    const second = materializeCharacterStoryInstance({
      character: sampleCharacter,
      characterId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      seed: 'character:rider-urban-commuter-3',
    });
    expect(first.characteristics.traits).toEqual(second.characteristics.traits);
    expect(first.characteristics.dailyRhythm).toEqual(second.characteristics.dailyRhythm);
  });

  it('uses custom displayName and seeds a small trait subset', () => {
    const instance = materializeCharacterStoryInstance({
      character: sampleCharacter,
      characterId: 'persona:rider',
      segmentId: 'urban-commuter',
      displayName: 'Maya',
      instanceId: 'maya-commute-1',
      seed: 42,
    });

    expect(instance.displayName).toBe('Maya');
    expect(instance.characterId).toBe('persona:rider');
    expect(instance.instanceId).toBe('maya-commute-1');
    const traits = instance.characteristics.traits ?? [];
    expect(traits.length).toBeGreaterThan(0);
    expect(traits.length).toBeLessThanOrEqual(3);
    for (const trait of traits) {
      expect(sampleCharacter.persona.traits ?? []).toContain(trait);
    }
  });

  it('honors character.instanceVariation traitPickCount', () => {
    const character: Character = {
      ...sampleCharacter,
      instanceVariation: { specVersion: '1.0', traitPickCount: 1, includeVoiceLine: false },
    };
    const row = pickCharacterInstanceCharacteristics(character, () => 0.5);
    expect(row.traits?.length).toBe(1);
    expect(row.voiceLine).toBeUndefined();
  });

  it('passes through persona.personality onto the instance', () => {
    const character: Character = {
      ...sampleCharacter,
      persona: {
        ...sampleCharacter.persona,
        personality: {
          wants: 'A friend who is not afraid of her',
          fears: 'Loud noises and slamming doors',
          flaw: 'Freezes when it matters most',
          delivery: { patterns: ['Near a whisper'], lines: ['Oh...'] },
          movement: ['Tiny steps'],
          temperament: ['Watchful'],
          moods: ['Anxious'],
          signatureMoves: ['Apologize before speaking'],
        },
      },
    };
    const withPersonality = pickCharacterInstanceCharacteristics(character, () => 0.5);
    expect(withPersonality.personality?.wants).toBe('A friend who is not afraid of her');
    expect(withPersonality.personality?.delivery?.lines).toEqual(['Oh...']);

    const omitted = pickCharacterInstanceCharacteristics(
      { ...character, instanceVariation: { specVersion: '1.0', includePersonality: false } },
      () => 0.5,
    );
    expect(omitted.personality).toBeUndefined();
  });

  it('is deterministic for the same random source', () => {
    const first = pickCharacterInstanceCharacteristics(sampleCharacter, () => 0.42);
    const second = pickCharacterInstanceCharacteristics(sampleCharacter, () => 0.42);
    expect(first.traits).toEqual(second.traits);
  });

  it('samples demographic bands from persona.demographic natively', () => {
    const character: Character = {
      ...sampleCharacter,
      persona: {
        ...sampleCharacter.persona,
        demographic: {
          aspects: [
            { frameworkId: 'age', typeId: '18-34', label: '18-34', weight: 0.2 },
            { frameworkId: 'age', typeId: '55-plus', label: '55+', weight: 0.8 },
            { frameworkId: 'income', typeId: 'under-50k', label: 'Under $50k', weight: 1 },
          ],
        },
      },
    };
    const alwaysHigh = pickCharacterInstanceCharacteristics(character, () => 0.99);
    expect(alwaysHigh.demographics?.age).toBe('55+');
    expect(alwaysHigh.demographics?.income).toBe('Under $50k');

    const fromSignals: Character = {
      ...sampleCharacter,
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
    const fromSignalBands = pickCharacterInstanceCharacteristics(fromSignals, () => 0.1);
    expect(fromSignalBands.demographics?.age).toBe('18-34');
  });

  it('skips demographic sampling when includeDemographics is false', () => {
    const character: Character = {
      ...sampleCharacter,
      instanceVariation: { specVersion: '1.0', includeDemographics: false },
      persona: {
        ...sampleCharacter.persona,
        demographic: {
          aspects: [{ frameworkId: 'age', typeId: '55-plus', label: '55+', weight: 1 }],
        },
      },
    };
    expect(pickCharacterInstanceCharacteristics(character, () => 0.5).demographics).toBeUndefined();
  });
});
