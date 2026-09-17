import { describe, expect, it } from 'vitest';

import type { Character } from '../../../src/contract/character/types/character.js';
import { resolvePersonaDailyRhythm } from '../../../src/contract/character/persona/resolve-persona-daily-rhythm.js';
import {
  findDailyRhythmBlock,
  formatDailyRhythmClock,
  samplePersonaDailyRhythm,
} from '../../../src/contract/character/persona/sample-persona-daily-rhythm.js';
import { DRIVER_WEEKDAY_DAILY_RHYTHM } from '../../../src/contract/character/persona/persona-daily-rhythm-presets.js';

function characterStub(persona: Character['persona']): Character {
  return {
    version: 1,
    id: persona.id,
    title: persona.label,
    revision: 1,
    persona,
  };
}

describe('resolvePersonaDailyRhythm', () => {
  it('defaults drivers to early wake', () => {
    const rhythm = resolvePersonaDailyRhythm(
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
    const rhythm = resolvePersonaDailyRhythm(
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

describe('samplePersonaDailyRhythm', () => {
  it('jitters block starts within template bounds', () => {
    const sampled = samplePersonaDailyRhythm(DRIVER_WEEKDAY_DAILY_RHYTHM, () => 0.99);
    const wake = findDailyRhythmBlock(sampled, 'wake');
    expect(wake).toBeTruthy();
    expect(formatDailyRhythmClock(wake!)).toMatch(/AM|PM/);
  });
});
