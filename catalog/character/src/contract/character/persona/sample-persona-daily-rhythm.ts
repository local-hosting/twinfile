import type {
  PersonaDailyRhythm,
  PersonaDailyRhythmBlock,
  SampledPersonaDailyRhythm,
} from '../types/strategy/persona-daily-rhythm.js';

function blockStartMinutes(block: PersonaDailyRhythmBlock): number {
  return block.startHour * 60 + (block.startMinute ?? 0);
}

function withStartMinutes(block: PersonaDailyRhythmBlock, minutes: number): PersonaDailyRhythmBlock {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const startHour = Math.floor(normalized / 60);
  const startMinute = normalized % 60;
  return {
    ...block,
    startHour,
    startMinute,
  };
}

function jitterSigned(random: () => number, maxMinutes: number): number {
  if (maxMinutes <= 0) {
    return 0;
  }
  const span = maxMinutes * 2 + 1;
  return Math.floor(random() * span) - maxMinutes;
}

export type SamplePersonaDailyRhythmOptions = {
  jitterMinutes?: number;
  sourceVariantId?: string;
};

function jitterBlocks(
  blocks: readonly PersonaDailyRhythmBlock[],
  random: () => number,
  jitter: number,
): PersonaDailyRhythmBlock[] {
  return blocks.map((block) => {
    const shifted = blockStartMinutes(block) + jitterSigned(random, jitter);
    return withStartMinutes(block, shifted);
  });
}

/** Apply per-instance jitter to a persona rhythm template. */
export function samplePersonaDailyRhythm(
  template: PersonaDailyRhythm,
  random: () => number = Math.random,
  options?: SamplePersonaDailyRhythmOptions,
): SampledPersonaDailyRhythm {
  const jitter = options?.jitterMinutes ?? template.jitterMinutes ?? 25;
  const weekday = jitterBlocks(template.weekday, random, jitter);
  const weekend = template.weekend?.length
    ? jitterBlocks(template.weekend, random, jitter)
    : undefined;

  return {
    specVersion: '1.0',
    label: template.label,
    timezone: template.timezone,
    weekday,
    ...(weekend ? { weekend } : {}),
    sourceTemplateLabel: template.label,
    ...(options?.sourceVariantId ? { sourceVariantId: options.sourceVariantId } : {}),
  };
}

/** Format block start for storyboards / briefs. */
export function formatDailyRhythmClock(block: PersonaDailyRhythmBlock): string {
  const hour = block.startHour;
  const minute = block.startMinute ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minutePart = minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`;
  return `${hour12}${minutePart} ${period}`;
}

export function findDailyRhythmBlock(
  rhythm: SampledPersonaDailyRhythm | PersonaDailyRhythm | undefined,
  blockId: PersonaDailyRhythmBlock['id'],
): PersonaDailyRhythmBlock | undefined {
  return rhythm?.weekday.find((row) => row.id === blockId);
}
