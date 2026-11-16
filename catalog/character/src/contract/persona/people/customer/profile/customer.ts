import { z } from 'zod';
import { SegmentEmpathyFacetSchema } from '../../../empathy/feel/empathy.schema.js';
import { SegmentHearFacetSchema } from '../../../empathy/hear/hear.schema.js';
import { SegmentSeeFacetSchema } from '../../../empathy/see/see.schema.js';
import {
  SegmentMentalModelFacetSchema,
  SegmentOverviewSchema,
} from '../../../empathy/think/mental-model.schema.js';
import {
  SegmentAttitudesFacetSchema,
  SegmentBehaviorFacetSchema,
  SegmentEmotionsFacetSchema,
  SegmentServicesFacetSchema,
  SegmentStrategyFacetSchema,
} from './segment-facets.js';
import {
  CustomerIntentIdSchema,
  PsychographicSegmentIdSchema,
} from './customer-ids.js';
import { SegmentTouchpointAffinitiesSchema } from '../../audience/audience-taxonomy.schema.js';
import {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from './engagement-ids.js';
import { UserTypeDefinitionSchema } from './user-type-definition.js';
import { HeartDimensionIdSchema } from '../../../shared/heart-dimension-id.schema.js';

export {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from './engagement-ids.js';
export type {
  EngagementLevelId,
  LifecycleStageId,
  VisitOpportunityId,
} from './engagement-ids.js';

export const VisitOpportunityDefinitionSchema = z.object({
  id: VisitOpportunityIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  intentIds: z.array(z.string().min(1)).default([]),
  userKind: z.enum(['lead', 'prospect', 'customer']).optional(),
});

export const CustomerIntentDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  verb: z.string().min(1).optional(),
  opportunityId: VisitOpportunityIdSchema,
  description: z.string().min(1).optional(),
});

export const CustomerPainPointSeveritySchema = z.enum(['low', 'medium', 'high']);

/**
 * Outcome gap or unmet need the customer wants the product or service to solve.
 * Motivates JTBD jobs via `leadsToJobIds`. Process friction and store failures belong in obstacles.
 */
export const CustomerPainPointDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  severity: CustomerPainPointSeveritySchema.optional(),
  lifecycleStageIds: z.array(LifecycleStageIdSchema).default([]),
  opportunityIds: z.array(VisitOpportunityIdSchema).default([]),
  intentIds: z.array(z.string().min(1)).default([]),
  segmentIds: z.array(z.string().min(1)).default([]),
  engagementLevelIds: z.array(EngagementLevelIdSchema).default([]),
  /** JTBD job ids this pain motivates — completing those jobs addresses the pain. */
  leadsToJobIds: z.array(z.string().min(1)).default([]),
  /** HEART dimension this pain degrades most directly. */
  heartDimensionId: HeartDimensionIdSchema.optional(),
});

export const LifecycleNeedsSchema = z.object({
  needs: z.array(z.string().min(1)).default([]),
  /** Inline pain labels — prefer painPointIds when catalog entries exist. */
  painPoints: z.array(z.string().min(1)).default([]),
  painPointIds: z.array(z.string().min(1)).default([]),
  goals: z.array(z.string().min(1)).default([]),
});

export const LifecycleStageDefinitionSchema = z.object({
  id: LifecycleStageIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  customerNeeds: LifecycleNeedsSchema.optional(),
});

export const EngagementLevelDefinitionSchema = z.object({
  id: EngagementLevelIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  userKind: z.enum(['lead', 'prospect', 'customer']).optional(),
  lifecycleStageId: LifecycleStageIdSchema.optional(),
  lifecycleAction: z.string().min(1).optional(),
  nextLevelId: EngagementLevelIdSchema.optional(),
  validIntentIds: z.array(z.string().min(1)).default([]),
  characteristics: z.array(z.string().min(1)).optional(),
  needs: z.array(z.string().min(1)).optional(),
  typicalActions: z.array(z.string().min(1)).optional(),
  transition: z
    .object({
      action: z.string().min(1),
      fromLevelId: EngagementLevelIdSchema,
      toLevelId: EngagementLevelIdSchema,
      description: z.string().min(1).optional(),
      typicalDurationWeeks: z.number().positive().optional(),
    })
    .optional(),
});

export const ShoppingMethodLocationSchema = z.enum(['inside', 'outside']);

export const ShoppingMethodDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1).optional(),
  location: ShoppingMethodLocationSchema.optional(),
  quote: z.string().min(1).optional(),
  behaviors: z.array(z.string().min(1)).default([]),
  insight: z.string().min(1).optional(),
  storeNeeds: z.string().min(1).optional(),
  conversionStrategy: z.string().min(1).optional(),
});

export const LevelShoppingMethodWeightsSchema = z.object({
  primaryMethodId: z.string().min(1),
  secondaryMethodIds: z.array(z.string().min(1)).default([]),
  weights: z.record(z.string().min(1), z.number().min(0).max(1)),
  description: z.string().min(1).optional(),
});

export const IntentDerivationRuleSchema = z.object({
  levelGroup: z.enum(['prospect', 'customer']),
  methodId: z.string().min(1),
  intentId: z.string().min(1),
  description: z.string().min(1).optional(),
});

export const FocusAreaTierSchema = z.enum(['primary', 'secondary']);

export const FocusAreaDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  line: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  driverCategoryIds: z.array(z.string().min(1)).default([]),
  buyerProfileId: z.string().min(1).optional(),
  tier: FocusAreaTierSchema.default('primary').describe(
    'Primary concerns are default top-of-mind; secondary concerns are situational.',
  ),
  primaryRank: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Lower rank wins when multiple focus areas apply to a persona.'),
});

export const PsychographicSegmentSummarySchema = z.object({
  id: PsychographicSegmentIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
  mindset: z.string().min(1).optional(),
  journeyPace: z.enum(['slow', 'medium', 'fast']).optional(),
  pullQuote: z.string().min(1).optional(),
});

export const SegmentVisitFrequencySchema = z.object({
  label: z.string().min(1),
  annual: z.string().min(1).optional(),
  peak: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

export const SegmentVisitFrequencyPartSchema = z.object({
  visitFrequency: z.partialRecord(EngagementLevelIdSchema, SegmentVisitFrequencySchema),
});


function compactTouchpointSequences(value: unknown): unknown {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((item) => typeof item === 'string'),
    ),
  );
}

export const SegmentIntentObjectiveSchema = z.object({
  intentId: CustomerIntentIdSchema,
  validLevelIds: z.array(EngagementLevelIdSchema).default([]),
  touchpointSequences: z.preprocess(
    compactTouchpointSequences,
    z.record(z.string().min(1), z.array(z.string().min(1))).default({}),
  ),
});

export const SegmentOverviewPartSchema = z.object({
  overview: SegmentOverviewSchema,
});

export const SegmentObjectivesPartSchema = z.object({
  objectives: z.array(SegmentIntentObjectiveSchema),
});

/**
 * Strategic audience segment — a composite profile, not psychographics alone.
 * Facets cover attitudes, behavior, emotions, empathy, see, hear, mental model, strategy, services,
 * and optional inline demographics. Demographic profiles and personas attach via separate catalogs.
 */
export const PsychographicSegmentProfileSchema = z.object({
  id: PsychographicSegmentIdSchema,
  overview: SegmentOverviewSchema.optional(),
  exemplarPersonaId: z.string().min(1).optional(),
  visitFrequency: z
    .partialRecord(EngagementLevelIdSchema, SegmentVisitFrequencySchema)
    .optional(),
  attitudes: SegmentAttitudesFacetSchema.optional(),
  behavior: SegmentBehaviorFacetSchema.optional(),
  demographics: z.record(z.string(), z.unknown()).optional(),
  emotions: SegmentEmotionsFacetSchema.optional(),
  empathy: SegmentEmpathyFacetSchema.optional(),
  see: SegmentSeeFacetSchema.optional(),
  hear: SegmentHearFacetSchema.optional(),
  mentalModel: SegmentMentalModelFacetSchema.optional(),
  services: SegmentServicesFacetSchema.optional(),
  strategy: SegmentStrategyFacetSchema.optional(),
  objectives: z.array(SegmentIntentObjectiveSchema).default([]),
  /** Psychographic segment affinity for base touchpoint ids. */
  touchpointAffinities: SegmentTouchpointAffinitiesSchema.optional(),
});

export const CustomerLinkSchema = z.object({
  opportunityIntents: z
    .partialRecord(VisitOpportunityIdSchema, z.array(z.string().min(1)))
    .optional(),
  levelUserKind: z
    .partialRecord(EngagementLevelIdSchema, z.enum(['lead', 'prospect', 'customer']))
    .optional(),
  levelLifecycleStage: z
    .partialRecord(EngagementLevelIdSchema, LifecycleStageIdSchema)
    .optional(),
  levelShoppingMethods: z
    .partialRecord(EngagementLevelIdSchema, LevelShoppingMethodWeightsSchema)
    .optional(),
  intentDerivationRules: z.array(IntentDerivationRuleSchema).default([]),
  lifecycleStageIds: z.array(LifecycleStageIdSchema).default([]),
  heartDimensionByLifecycleStage: z
    .partialRecord(LifecycleStageIdSchema, z.string().min(1))
    .optional(),
});

export const CustomerCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0').describe('Customer catalog format version.'),
    methodId: z
      .string()
      .min(1)
      .optional()
      .describe('Method id when the catalog is method-scoped.'),
    userTypes: z
      .array(UserTypeDefinitionSchema)
      .min(1)
      .describe('Lead, prospect, and customer type taxonomy.'),
    opportunities: z
      .array(VisitOpportunityDefinitionSchema)
      .min(1)
      .describe('Visit opportunity scenarios (prospect, fixer, upgrader, etc.).'),
    intents: z
      .array(CustomerIntentDefinitionSchema)
      .min(1)
      .describe('Customer intents mapped to visit opportunities.'),
    lifecycleStages: z
      .array(LifecycleStageDefinitionSchema)
      .min(1)
      .describe('Lifecycle stages with optional needs and pain points.'),
    engagementLevels: z
      .array(EngagementLevelDefinitionSchema)
      .min(1)
      .describe('Engagement depth levels with valid intents and transitions.'),
    shoppingMethods: z
      .array(ShoppingMethodDefinitionSchema)
      .min(1)
      .describe('In-store or omnichannel shopping method archetypes.'),
    psychographicSegments: z
      .array(PsychographicSegmentSummarySchema)
      .default([])
      .describe('Summary psychographic segment rows for segmentation.'),
    focusAreas: z
      .array(FocusAreaDefinitionSchema)
      .default([])
      .describe('Strategic focus areas linked to driver categories.'),
    painPoints: z
      .array(CustomerPainPointDefinitionSchema)
      .default([])
      .describe('Canonical customer pain points that motivate JTBD jobs.'),
    links: CustomerLinkSchema.optional().describe(
      'Cross-entity relationship maps between levels, intents, and methods.',
    ),
  })
  .describe(
    'Customer taxonomy: user types, intents, lifecycle, engagement, segments, and pain points.',
  );

export const PsychographicSegmentCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0').describe('Segment catalog format version.'),
    methodId: z
      .string()
      .min(1)
      .optional()
      .describe('Method id when profiles are method-scoped.'),
    segments: z
      .array(PsychographicSegmentProfileSchema)
      .min(1)
      .describe('Full psychographic profiles with facet detail and exemplar persona refs.'),
  })
  .describe('Detailed psychographic segment profiles with cognition and facet overlays.');

export type VisitOpportunityDefinition = z.infer<typeof VisitOpportunityDefinitionSchema>;
export type CustomerIntentDefinition = z.infer<typeof CustomerIntentDefinitionSchema>;
export type CustomerPainPointSeverity = z.infer<typeof CustomerPainPointSeveritySchema>;
export type CustomerPainPointDefinition = z.infer<typeof CustomerPainPointDefinitionSchema>;
export type LifecycleNeeds = z.infer<typeof LifecycleNeedsSchema>;
export type LifecycleStageDefinition = z.infer<typeof LifecycleStageDefinitionSchema>;
export type EngagementLevelDefinition = z.infer<typeof EngagementLevelDefinitionSchema>;
export type ShoppingMethodDefinition = z.infer<typeof ShoppingMethodDefinitionSchema>;
export type FocusAreaDefinition = z.infer<typeof FocusAreaDefinitionSchema>;
export type PsychographicSegmentSummary = z.infer<typeof PsychographicSegmentSummarySchema>;
export type PsychographicSegmentProfile = z.infer<typeof PsychographicSegmentProfileSchema>;
export type PsychographicSegmentProfileInput = z.input<typeof PsychographicSegmentProfileSchema>;
export type CustomerCatalog = z.infer<typeof CustomerCatalogSchema>;
export type PsychographicSegmentCatalog = z.infer<typeof PsychographicSegmentCatalogSchema>;
export type CustomerLink = z.infer<typeof CustomerLinkSchema>;

/** Client-owned enrichments merged onto getDefaultCustomerCatalog(). */
export interface CustomerCatalogOverlay {
  methodId?: string;
  lifecycleStages?: LifecycleStageDefinition[];
  engagementLevels?: EngagementLevelDefinition[];
  shoppingMethods?: ShoppingMethodDefinition[];
  focusAreas?: FocusAreaDefinition[];
  psychographicSegments?: PsychographicSegmentSummary[];
  painPoints?: CustomerPainPointDefinition[];
}
