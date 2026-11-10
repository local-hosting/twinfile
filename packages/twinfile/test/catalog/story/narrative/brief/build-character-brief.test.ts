import { describe, expect, it } from 'vitest';

import { buildCharacterBrief } from '../../../../../src/catalog/story/contract/narrative/brief/build-character-brief.js';

describe('buildCharacterBrief', () => {
  it('includes a Personality section from dramaturgy fields', () => {
    const brief = buildCharacterBrief({
      character: {
        characterId: 'blork',
        name: 'Blork',
        psychology: {
          mindset: 'timid',
          traits: ['Timid', 'Curious', 'Gentle'],
          personality: {
            wants: 'A friend who is not afraid of her',
            fears: 'Loud noises and slamming doors',
            flaw: 'Freezes when it matters most',
            delivery: {
              patterns: ['Near a whisper', 'No contractions'],
              lines: ['Oh...', '...if that is okay.'],
            },
            movement: ['Tiny steps', 'Hugs her arms'],
            temperament: ['Watchful'],
            moods: ['Anxious', 'Hopeful'],
            signatureMoves: ['Apologize before speaking'],
          },
        },
      },
    });

    const personality = brief.sections.find((section) => section.title === 'Personality');
    expect(personality).toBeDefined();
    expect(personality?.bullets.some((line) => line.includes('Wants:'))).toBe(true);
    expect(personality?.bullets.some((line) => line.includes('Signature moves:'))).toBe(true);
    expect(personality?.bullets.some((line) => line.includes('Near a whisper'))).toBe(true);
  });
});
