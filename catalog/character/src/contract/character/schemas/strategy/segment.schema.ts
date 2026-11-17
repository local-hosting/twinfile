import { z } from 'zod';

export const SegmentDimensionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

export const AudienceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  characterId: z.string().min(1),
  thinkingStyleId: z.string().min(1).optional(),
  dimensions: z.record(z.string(), z.union([z.string().min(1), z.array(z.string().min(1))])),
  campaign: z.string().min(1).optional(),
});
