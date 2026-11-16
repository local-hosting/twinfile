import { z } from 'zod';
import { SegmentCulturalProfileV1Schema } from './segment-cultural-profile.schema.js';
import { SegmentInterestV1Schema } from './segment-interests.schema.js';
import { SegmentMindsetV1Schema } from './segment-mindset.schema.js';
import { SegmentMotivationV1Schema } from './segment-motivation.schema.js';

/** Census / H3 field filter for geo audience matching. */
export const SegmentGeoAudienceCriterionSchema = z.object({
  field: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional(),
  equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
  contains: z.string().optional(),
  weight: z.number().optional(),
});

export const SegmentGeoAudienceInsightSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  recordedAt: z.string().min(1),
  source: z.string().min(1).optional(),
  notes: z.array(z.string().min(1)).default([]),
  matchProfile: z.object({
    description: z.string().min(1),
    criteria: z.array(SegmentGeoAudienceCriterionSchema).default([]),
    minScore: z.number().min(0).max(1).optional(),
  }),
  overIndexMarkets: z.array(z.string().min(1)).default([]),
  underIndexPatterns: z.array(z.string().min(1)).default([]),
  mindset: SegmentMindsetV1Schema.optional(),
  motivation: SegmentMotivationV1Schema.optional(),
  interests: z.array(SegmentInterestV1Schema).optional(),
  culturalProfile: SegmentCulturalProfileV1Schema.optional(),
});

export type SegmentGeoAudienceCriterion = z.infer<typeof SegmentGeoAudienceCriterionSchema>;
export type SegmentGeoAudienceInsight = z.infer<typeof SegmentGeoAudienceInsightSchema>;

export function parseSegmentGeoAudienceInsight(value: unknown): SegmentGeoAudienceInsight {
  return SegmentGeoAudienceInsightSchema.parse(value);
}

export function isSegmentGeoAudienceInsight(value: unknown): value is SegmentGeoAudienceInsight {
  return SegmentGeoAudienceInsightSchema.safeParse(value).success;
}
