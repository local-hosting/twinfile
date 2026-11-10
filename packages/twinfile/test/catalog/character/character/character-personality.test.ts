import { describe, expect, it } from 'vitest';

import { parseCharacter } from '../../../../src/catalog/character/contract/character/schemas/character.schema.js';
import { CharacterPersonalitySchema } from '../../../../src/catalog/character/contract/character/schemas/character-persona.schema.js';

const blorkPersonality = {
  wants: 'A friend who is not afraid of her',
  fears: 'Loud noises and slamming doors',
  flaw: 'Freezes when it matters most',
  delivery: {
    patterns: ['Near a whisper', 'Hesitant pauses', 'Trails off', 'No contractions'],
    lines: ['Oh...', 'I did not mean to...', '...if that is okay.'],
  },
  movement: [
    'Hunched inward',
    'Tiny steps',
    'Sleeves over hands',
    'Hugs her arms',
    'Perches on edges',
    'Backs away',
  ],
  temperament: [
    'Hyper-sensitive',
    'Endearingly literal',
    'Wears every feeling',
    'Self-effacing',
    'Watchful',
  ],
  moods: ['Anxious', 'Hopeful', 'Startled'],
  signatureMoves: ['Apologize before speaking', 'Shrink into sleeves when noticed'],
};

describe('CharacterPersonality', () => {
  it('parses a dramaturgy sheet matching the Personality tab shape', () => {
    const personality = CharacterPersonalitySchema.parse(blorkPersonality);
    expect(personality.wants).toBe(blorkPersonality.wants);
    expect(personality.delivery?.patterns).toEqual(blorkPersonality.delivery.patterns);
    expect(personality.delivery?.lines).toEqual(blorkPersonality.delivery.lines);
    expect(personality.movement).toHaveLength(6);
    expect(personality.signatureMoves?.[0]).toMatch(/Apologize/);
  });

  it('round-trips on Character.persona with poster-rail traits', () => {
    const character = parseCharacter({
      id: 'blork',
      title: 'Blork',
      revision: 1,
      summary: 'The Gentle Outsider · A timid alien stranded on Earth, desperate for one friend.',
      persona: {
        id: 'blork',
        label: 'Blork',
        who: 'The Gentle Outsider · A timid alien stranded on Earth, desperate for one friend.',
        quote: 'Oh... if that is okay.',
        segment: 'story',
        goals: [],
        frustrations: [],
        traits: ['Timid', 'Curious', 'Gentle', 'Apologetic', 'Easily startled'],
        personality: blorkPersonality,
      },
    });

    expect(character.persona.traits).toEqual([
      'Timid',
      'Curious',
      'Gentle',
      'Apologetic',
      'Easily startled',
    ]);
    expect(character.persona.personality).toEqual(blorkPersonality);
  });
});
