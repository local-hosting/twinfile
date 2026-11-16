import type { PCM } from '../types/pcm.js';
import type { PersonaDailyRhythm } from '../types/strategy/persona-daily-rhythm.js';
import {
  CREATIVE_LATE_WEEKDAY_DAILY_RHYTHM,
  DRIVER_WEEKDAY_DAILY_RHYTHM,
  URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM,
} from './persona-daily-rhythm-presets.js';

function textIncludes(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

/** Resolve the weekday rhythm template for a PCM persona (explicit or role-based default). */
export function resolvePersonaDailyRhythm(pcm: PCM): PersonaDailyRhythm {
  const authored = pcm.persona.dailyRhythm;
  if (authored?.weekday?.length) {
    return authored;
  }

  const role = pcm.persona.role?.trim() ?? '';
  const segment = pcm.persona.segment?.trim() ?? '';
  const occupation = pcm.persona.exemplar?.occupation?.trim() ?? '';
  const who = pcm.persona.who?.trim() ?? '';

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
