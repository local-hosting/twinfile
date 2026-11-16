import type { CharacterPersona } from '../types/character-persona.js';
import type { PersonaDailyRhythm, PersonaDailyRhythmBlock } from '../types/strategy/persona-daily-rhythm.js';

export type AdjustDailyRhythmForInstanceInput = {
  persona: CharacterPersona;
  demographics?: Readonly<Record<string, string>>;
};

function blockStartMinutes(block: PersonaDailyRhythmBlock): number {
  return block.startHour * 60 + (block.startMinute ?? 0);
}

function withStartMinutes(block: PersonaDailyRhythmBlock, minutes: number): PersonaDailyRhythmBlock {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    ...block,
    startHour: Math.floor(normalized / 60),
    startMinute: normalized % 60,
  };
}

function shiftBlocks(
  blocks: readonly PersonaDailyRhythmBlock[],
  shiftMinutes: number,
): PersonaDailyRhythmBlock[] {
  if (shiftMinutes === 0) {
    return [...blocks];
  }
  return blocks.map((block) => withStartMinutes(block, blockStartMinutes(block) + shiftMinutes));
}

function readScheduleAttribute(persona: CharacterPersona): string | undefined {
  const attributes = persona.attributes ?? {};
  const keys = [
    'work_schedule',
    'attr:work-schedule',
    'schedule',
    'shift',
    'work_shift',
  ];
  for (const key of keys) {
    const value = attributes[key]?.trim();
    if (value) {
      return value.toLowerCase();
    }
  }
  return undefined;
}

function shiftFromScheduleAttribute(schedule: string | undefined): number {
  if (!schedule) {
    return 0;
  }
  if (schedule.includes('early') || schedule === 'morning' || schedule.includes('5am')) {
    return -45;
  }
  if (schedule.includes('late') || schedule === 'evening' || schedule.includes('10am')) {
    return 60;
  }
  if (schedule.includes('night') || schedule.includes('graveyard') || schedule === 'shift') {
    return 360;
  }
  if (schedule.includes('standard') || schedule.includes('9-5') || schedule.includes('office')) {
    return 0;
  }
  return 0;
}

function shiftFromJourneyPace(pace: CharacterPersona['journeyPace']): number {
  if (pace === 'fast') {
    return -20;
  }
  if (pace === 'slow') {
    return 25;
  }
  return 0;
}

function shiftFromDemographics(demographics?: Readonly<Record<string, string>>): number {
  const age = demographics?.age?.toLowerCase() ?? '';
  if (!age) {
    return 0;
  }
  if (age.includes('18') || age.includes('25') || age.includes('college') || age.includes('gen z')) {
    return 35;
  }
  if (age.includes('55') || age.includes('65') || age.includes('retire')) {
    return -25;
  }
  return 0;
}

/**
 * Correlate catalog template with sampled demographics, journey pace, and persona attributes
 * before per-instance jitter.
 */
export function adjustDailyRhythmForInstance(
  template: PersonaDailyRhythm,
  input: AdjustDailyRhythmForInstanceInput,
): PersonaDailyRhythm {
  const shiftMinutes =
    shiftFromScheduleAttribute(readScheduleAttribute(input.persona)) +
    shiftFromJourneyPace(input.persona.journeyPace) +
    shiftFromDemographics(input.demographics);

  if (shiftMinutes === 0) {
    return template;
  }

  return {
    ...template,
    weekday: shiftBlocks(template.weekday, shiftMinutes),
    ...(template.weekend?.length ? { weekend: shiftBlocks(template.weekend, shiftMinutes) } : {}),
  };
}
