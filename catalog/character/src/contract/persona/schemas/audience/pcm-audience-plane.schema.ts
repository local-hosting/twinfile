import { z } from 'zod';

export const PcmAudienceAspectSourceSchema = z.enum([
  'declared',
  'inferred',
  'modeled',
  'sampled',
]);

export const PcmAudienceAspectRefSchema = z.object({
  frameworkId: z.string().min(1),
  typeId: z.string().min(1),
  label: z.string().min(1).optional(),
  weight: z.number().min(0).max(1).optional(),
  source: PcmAudienceAspectSourceSchema.optional(),
});

export const PcmAudiencePlaneSchema = z.object({
  profileId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  cohortId: z.string().min(1).optional(),
  aspects: z.array(PcmAudienceAspectRefSchema).default([]),
  attributes: z.record(z.string(), z.unknown()).optional(),
  source: PcmAudienceAspectSourceSchema.optional(),
});
