import type { Character } from '../types/character.js';
import type { PersonaDailyRhythm } from '../types/strategy/persona-daily-rhythm.js';
import {
  CREATIVE_LATE_WEEKDAY_DAILY_RHYTHM,
  DRIVER_WEEKDAY_DAILY_RHYTHM,
  URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM,
} from './character-daily-rhythm-presets.js';

function textIncludes(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

/** Resolve the weekday rhythm template for a Character persona (explicit or role-based default). */
export function resolveCharacterDailyRhythm(character: Character): PersonaDailyRhythm {
  const authored = character.persona.dailyRhythm;
  if (authored?.weekday?.length) {
    return authored;
  }

  const role = character.persona.role?.trim() ?? '';
  const segment = character.persona.segment?.trim() ?? '';
  const occupation = character.persona.exemplar?.occupation?.trim() ?? '';
  const who = character.persona.who?.trim() ?? '';

  if (
    textIncludes(role, ['driver', 'courier']) ||
    textIncludes(segment, ['driver', 'fleet']) ||
    textIncludes(occupation, ['driver', 'courier'])
  ) {
    return DRIVER_WEEKDAY_DAILY_RHYTHM;
  }

  if (
    textIncludes(occupation, ['artist', 'musician', 'illustrator', 'writer', 'filmmaker']) ||
    textIncludes(who, ['artist', 'creative', 'studio']) ||
    textIncludes(segment, ['creative', 'artist'])
  ) {
    return CREATIVE_LATE_WEEKDAY_DAILY_RHYTHM;
  }

  return URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM;
}
