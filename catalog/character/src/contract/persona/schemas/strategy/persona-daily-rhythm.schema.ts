import { z } from 'zod';

import { PERSONA_DAILY_BLOCK_IDS } from '../../types/strategy/persona-daily-rhythm.js';

const hourSchema = z.number().int().min(0).max(23);
const minuteSchema = z.number().int().min(0).max(59);

export const PersonaDailyRhythmBlockSchema = z.object({
  id: z.enum(PERSONA_DAILY_BLOCK_IDS),
  label: z.string().min(1),
  startHour: hourSchema,
  startMinute: minuteSchema.optional(),
  endHour: hourSchema.optional(),
  endMinute: minuteSchema.optional(),
  setting: z.enum(['home', 'work', 'transit', 'other']),
  notes: z.string().min(1).optional(),
});

export const PersonaDailyRhythmSchema = z.object({
  specVersion: z.literal('1.0'),
  label: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  weekday: z.array(PersonaDailyRhythmBlockSchema).min(1),
  weekend: z.array(PersonaDailyRhythmBlockSchema).optional(),
  jitterMinutes: z.number().int().min(0).max(120).optional(),
});

export const PersonaDailyRhythmVariantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  weight: z.number().positive().optional(),
  weekday: z.array(PersonaDailyRhythmBlockSchema).min(1),
  weekend: z.array(PersonaDailyRhythmBlockSchema).optional(),
  jitterMinutes: z.number().int().min(0).max(120).optional(),
});

export const SampledPersonaDailyRhythmSchema = PersonaDailyRhythmSchema.extend({
  sourceTemplateLabel: z.string().min(1).optional(),
  sourceVariantId: z.string().min(1).optional(),
});
