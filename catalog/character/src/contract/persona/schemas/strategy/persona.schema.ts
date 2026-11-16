import { z } from 'zod';

import { coalesceJobIdsFields } from '../coalesce-job-ids.js';
import {
  PersonaDailyRhythmSchema,
  PersonaDailyRhythmVariantSchema,
} from './persona-daily-rhythm.schema.js';

const PersonaEmpathyPolaritySchema = z.object({
  positive: z.array(z.string().min(1)).default([]),
  negative: z.array(z.string().min(1)).default([]),
});

export const PersonaEmpathyMapSchema = z.object({
  think: z.array(z.string().min(1)).default([]),
  feel: PersonaEmpathyPolaritySchema,
  say: PersonaEmpathyPolaritySchema,
  do: z.array(z.string().min(1)).default([]),
});

export const PersonaExemplarSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  occupation: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  background: z.string().min(1).optional(),
  languages: z.array(z.string().min(1)).optional(),
  household: z.string().min(1).optional(),
});

/** Object shape — use for `.omit` / `.extend` (preprocess wrappers have no `.omit`). */
export const PersonaFieldsSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  qualifier: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  primary: z.boolean().optional(),
  role: z.string().min(1).optional(),
  quote: z.string().min(1),
  who: z.string().min(1).optional(),
  mindset: z.string().min(1).optional(),
  journeyPace: z.enum(['slow', 'medium', 'fast']).optional(),
  goals: z.array(z.string()).default([]),
  frustrations: z.array(z.string()).default([]),
  segment: z.string().min(1),
  status: z.enum(['active', 'placeholder']).optional(),
  jobIds: z.array(z.string().min(1)).default([]),
  share: z.number().min(0).max(100).optional(),
  exemplar: PersonaExemplarSchema.optional(),
  empathy: PersonaEmpathyMapSchema.optional(),
  insights: z.array(z.string().min(1)).optional(),
  watchouts: z.array(z.string().min(1)).optional(),
  channels: z.array(z.string().min(1)).optional(),
  attributes: z.record(z.string().min(1), z.string().min(1)).optional(),
  traits: z.array(z.string().min(1)).optional(),
  hobbies: z.array(z.string().min(1)).optional(),
  devices: z.array(z.string().min(1)).optional(),
  apps: z.array(z.string().min(1)).optional(),
  opportunities: z.array(z.string().min(1)).optional(),
  thinkingStyleIds: z.array(z.string().min(1)).optional(),
  dailyRhythm: PersonaDailyRhythmSchema.optional(),
  dailyRhythmVariants: z.array(PersonaDailyRhythmVariantSchema).min(1).optional(),
});

export const PersonaSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? coalesceJobIdsFields(raw as Record<string, unknown>)
      : raw,
  PersonaFieldsSchema,
);
