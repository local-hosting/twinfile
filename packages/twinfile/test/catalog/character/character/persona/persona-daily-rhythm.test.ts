import { describe, expect, it } from 'vitest';

import type { Character } from '../../../../../src/catalog/character/contract/character/types/character.js';
import { resolveCharacterDailyRhythm } from '../../../../../src/catalog/character/contract/character/persona/resolve-character-daily-rhythm.js';
import {
  findDailyRhythmBlock,
  formatDailyRhythmClock,
  sampleCharacterDailyRhythm,
} from '../../../../../src/catalog/character/contract/character/persona/sample-character-daily-rhythm.js';
import { DRIVER_WEEKDAY_DAILY_RHYTHM } from '../../../../../src/catalog/character/contract/character/persona/character-daily-rhythm-presets.js';

function characterStub(persona: Character['persona']): Character {
  return {
    version: 1,
    id: persona.id,
    title: persona.label,
    revision: 1,
    persona,
  };
}

describe('resolveCharacterDailyRhythm', () => {
  it('defaults drivers to early wake', () => {
    const rhythm = resolveCharacterDailyRhythm(
      characterStub({
        id: 'persona:driver',
        label: 'Driver',
        quote: 'Drive',
        goals: [],
        frustrations: [],
        segment: 'fleet-driver',
        jobIds: [],
        role: 'driver',
      }),
    );
    const wake = findDailyRhythmBlock(rhythm, 'wake');
    expect(wake?.startHour).toBe(5);
  });

  it('defaults artists to late wake', () => {
    const rhythm = resolveCharacterDailyRhythm(
      characterStub({
        id: 'persona:artist',
        label: 'Artist',
        quote: 'Paint',
        goals: [],
        frustrations: [],
        segment: 'creative',
        jobIds: [],
        exemplar: { name: 'Lena', occupation: 'Illustrator' },
      }),
    );
    const wake = findDailyRhythmBlock(rhythm, 'wake');
    expect(wake?.startHour).toBeGreaterThanOrEqual(9);
  });
});

describe('sampleCharacterDailyRhythm', () => {
  it('jitters block starts within template bounds', () => {
    const sampled = sampleCharacterDailyRhythm(DRIVER_WEEKDAY_DAILY_RHYTHM, () => 0.99);
    const wake = findDailyRhythmBlock(sampled, 'wake');
    expect(wake).toBeTruthy();
    expect(formatDailyRhythmClock(wake!)).toMatch(/AM|PM/);
  });
});
