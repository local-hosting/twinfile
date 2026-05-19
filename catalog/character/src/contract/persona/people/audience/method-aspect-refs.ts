import { z } from 'zod';
import { CustomerIntentIdSchema } from '../customer/profile/customer-ids.js';
import {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from '../customer/profile/engagement-ids.js';
import { PsychographicAspectRefSchema } from './psychographic.schema.js';

export const ArchetypeAspectRefSchema = z.object({
  archetypeId: z.string().min(1),
  catalogId: z.string().min(1).optional(),
});

export const PersonaAspectRefSchema = z.object({
  personaId: z.string().min(1).optional(),
  source: z.enum(['declared', 'inferred', 'modeled']).optional(),
});

export const DemographicAspectRefSchema = z.object({
  profileId: z.string().min(1).optional(),
  cohortId: z.string().min(1).optional(),
  source: z.enum(['declared', 'inferred', 'modeled']).optional(),
});

export const GeographicAspectRefSchema = z.object({
  venueId: z.string().min(1).optional(),
  marketId: z.string().min(1).optional(),
  h3Cell: z.string().min(1).optional(),
  source: z.enum(['declared', 'inferred', 'modeled']).optional(),
});

export const BehavioralAspectRefSchema = z.object({
  sessionId: z.string().min(1).optional(),
  visitCountBandId: z.string().min(1).optional(),
  lastChannelId: z.string().min(1).optional(),
  source: z.enum(['observed', 'inferred', 'modeled']).optional(),
});

export const CommercialAspectRefSchema = z.object({
  accountId: z.string().min(1).optional(),
  planTierId: z.string().min(1).optional(),
  tenureBandId: z.string().min(1).optional(),
  productIds: z.array(z.string().min(1)).default([]),
});

export const FocusInterestAspectRefSchema = z.object({
  focusAreaIds: z.array(z.string().min(1)).default([]),
  primaryFocusAreaId: z.string().min(1).optional(),
});

/** Engagement depth, lifecycle position, intents, and visit opportunities. */
export const RelationshipAspectRefSchema = z.object({
  engagementLevelId: EngagementLevelIdSchema,
  intentIds: z.array(CustomerIntentIdSchema).default([]),
  lifecycleStageId: LifecycleStageIdSchema.optional(),
  opportunityIds: z.array(VisitOpportunityIdSchema).default([]),
  source: z.enum(['declared', 'inferred', 'modeled', 'classified']).optional(),
});

export const UserAspectRefsSchema = z.object({
  archetype: ArchetypeAspectRefSchema.optional(),
  psychographic: PsychographicAspectRefSchema.optional(),
  persona: PersonaAspectRefSchema.optional(),
  demographic: DemographicAspectRefSchema.optional(),
  geographic: GeographicAspectRefSchema.optional(),
  behavioral: BehavioralAspectRefSchema.optional(),
  commercial: CommercialAspectRefSchema.optional(),
  focusInterest: FocusInterestAspectRefSchema.optional(),
  relationship: RelationshipAspectRefSchema.optional(),
});

export const UserAspectIdSchema = z.enum([
  'archetype',
  'psychographic',
  'persona',
  'demographic',
  'geographic',
  'behavioral',
  'commercial',
  'focusInterest',
  'relationship',
]);

export const UserAspectJoinPointSchema = z.enum(['onClassify', 'onValidate', 'onResolve']);

export type ArchetypeAspectRef = z.infer<typeof ArchetypeAspectRefSchema>;
export type PersonaAspectRef = z.infer<typeof PersonaAspectRefSchema>;
export type DemographicAspectRef = z.infer<typeof DemographicAspectRefSchema>;
export type GeographicAspectRef = z.infer<typeof GeographicAspectRefSchema>;
export type BehavioralAspectRef = z.infer<typeof BehavioralAspectRefSchema>;
export type CommercialAspectRef = z.infer<typeof CommercialAspectRefSchema>;
export type RelationshipAspectRef = z.infer<typeof RelationshipAspectRefSchema>;
export type FocusInterestAspectRef = z.infer<typeof FocusInterestAspectRefSchema>;
export type UserAspectRefs = z.infer<typeof UserAspectRefsSchema>;
export type UserAspectId = z.infer<typeof UserAspectIdSchema>;
export type UserAspectJoinPoint = z.infer<typeof UserAspectJoinPointSchema>;
