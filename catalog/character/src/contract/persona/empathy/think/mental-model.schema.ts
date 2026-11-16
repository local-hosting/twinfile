import { z } from 'zod';
import {
  MentalModelByFocusMapSchema,
  MentalModelByIntentMapSchema,
  MentalModelByLevelMapSchema,
} from '../../people/customer/graph/customer-relationships.js';
import { PsychographicSegmentIdSchema } from '../../people/customer/profile/customer-ids.js';
import {
  JourneyPaceSchema,
  MindsetSchema,
  ThinkingStyleIdSchema,
  ThinkingStyleListSchema,
  ThinkingStyleSchema,
  normalizeThinkingStyle,
  thinkingStyleIdFromLabel,
} from './thinking-style.js';

export {
  JourneyPaceSchema,
  MindsetSchema,
  ThinkingStyleIdSchema,
  ThinkingStyleListSchema,
  ThinkingStyleSchema,
  normalizeThinkingStyle,
  thinkingStyleIdFromLabel,
};
export type { JourneyPace, Mindset, ThinkingStyle } from './thinking-style.js';

/** Scoped composition of thinking styles — HOW they decide, keyed by context. */
export const MentalModelScopeSchema = z.object({
  segment: PsychographicSegmentIdSchema.optional(),
  mentalSpaces: z.array(ThinkingStyleSchema).optional(),
  byFocus: MentalModelByFocusMapSchema.optional(),
  byLevel: MentalModelByLevelMapSchema.optional(),
  byObjective: MentalModelByIntentMapSchema.optional(),
  base: z.object({ mentalSpaces: z.array(ThinkingStyleSchema).default([]) }).optional(),
});

export const SegmentMentalModelFacetSchema = z.object({
  mentalModel: MentalModelScopeSchema,
});

export const SegmentOverviewSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  aboutTheCustomer: z.string().min(1).optional(),
  communicationImplications: z.string().min(1).optional(),
  mindset: z.string().min(1).optional(),
  journeyPace: JourneyPaceSchema.optional(),
  percentage: z.number().min(0).max(100).optional(),
  pullQuote: z.string().min(1).optional(),
  segmentInsights: z.array(z.string().min(1)).optional(),
  watchoutsAndBarriers: z.string().min(1).optional(),
  whatIsAttractive: z.string().min(1).optional(),
  whyAppeal: z.string().min(1).optional(),
});

export type MentalModelScope = z.infer<typeof MentalModelScopeSchema>;
export type SegmentMentalModelFacet = z.infer<typeof SegmentMentalModelFacetSchema>;
export type SegmentOverview = z.infer<typeof SegmentOverviewSchema>;

export function mentalModelScopeFromFacet(
  facet: SegmentMentalModelFacet | undefined,
): MentalModelScope | undefined {
  return facet?.mentalModel;
}
