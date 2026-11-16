import { z } from 'zod';

export const CulturalCompositionEntryV1Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sharePct: z.number().min(0).max(100),
});

export const SegmentCulturalProfileV1Schema = z.object({
  ethnicity: z.array(CulturalCompositionEntryV1Schema).default([]),
});

export type CulturalCompositionEntryV1 = z.infer<typeof CulturalCompositionEntryV1Schema>;
export type SegmentCulturalProfileV1 = z.infer<typeof SegmentCulturalProfileV1Schema>;
