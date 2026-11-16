import { z } from 'zod';

export const CharacterAudienceAspectSourceSchema = z.enum([
  'declared',
  'inferred',
  'modeled',
  'sampled',
]);

export const CharacterAudienceAspectRefSchema = z.object({
  frameworkId: z.string().min(1),
  typeId: z.string().min(1),
  label: z.string().min(1).optional(),
  weight: z.number().min(0).max(1).optional(),
  source: CharacterAudienceAspectSourceSchema.optional(),
});

export const CharacterAudiencePlaneSchema = z.object({
  profileId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  cohortId: z.string().min(1).optional(),
  aspects: z.array(CharacterAudienceAspectRefSchema).default([]),
  attributes: z.record(z.string(), z.unknown()).optional(),
  source: CharacterAudienceAspectSourceSchema.optional(),
});
