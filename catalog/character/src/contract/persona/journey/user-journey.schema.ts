import { z } from 'zod';
import { EmpathyChannelSchema } from '../empathy/feel/empathy.schema.js';
import { EmpathyJourneyPhaseIdSchema, CustomerIntentIdSchema } from '../people/customer/profile/customer-ids.js';
import { HeartDimensionIdSchema } from '../shared/heart-dimension-id.schema.js';
import {
  CustomerJourneyPhaseSchema,
  TouchpointFunnelStageSchema,
  TouchpointGraphSpecSchema,
} from './touchpoints.schema.js';
import {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from '../people/customer/profile/engagement-ids.js';
import { UserKindSchema, UserTypeIdSchema } from '../people/customer/profile/user-type-definition.js';

/** Emotional valence at a journey phase — empathy and segment emotion facets. */
export const JourneyEmotionValenceSchema = z.enum(['negative', 'neutral', 'positive']);

/** Phase-scoped emotion profile — links to empathy and segment emotion facets. */
export const JourneyPhaseEmotionProfileSchema = z.object({
  valence: JourneyEmotionValenceSchema.optional(),
  feelings: z
    .object({
      positive: z.array(z.string().min(1)).default([]),
      negative: z.array(z.string().min(1)).default([]),
    })
    .optional(),
  empathyChannel: EmpathyChannelSchema.optional(),
  empathyPhaseId: EmpathyJourneyPhaseIdSchema.optional(),
});

/** Reference to a journey phase — used to scope JTBD to situation/context. */
export const JourneyPhaseRefSchema = z.object({
  journeyId: z.string().min(1),
  phaseId: z.string().min(1),
});

/** Ordered journey stage with goals, touchpoints, and cross-catalog associations. */
export const UserJourneyPhaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
  goal: z.string().min(1),
  description: z.string().min(1).optional(),
  /** Phase situation/context — overrides journey situation when set. */
  situation: z.string().min(1).optional(),
  narrativeBeat: z.string().min(1).optional(),
  lifecycleStageId: LifecycleStageIdSchema.optional(),
  visitPhase: CustomerJourneyPhaseSchema.optional(),
  engagementLevelIds: z.array(EngagementLevelIdSchema).default([]),
  opportunityIds: z.array(VisitOpportunityIdSchema).default([]),
  intentIds: z.array(CustomerIntentIdSchema).default([]),
  touchpointIds: z.array(z.string().min(1)).default([]),
  /** JTBD jobs accomplishable in this phase's situation/context. */
  jobIds: z.array(z.string().min(1)).default([]),
  /** Obstacles that commonly block progress during this phase. */
  obstacleIds: z.array(z.string().min(1)).default([]),
  painPointIds: z.array(z.string().min(1)).default([]),
  heartDimensionId: HeartDimensionIdSchema.optional(),
  funnelStages: z.array(TouchpointFunnelStageSchema).default([]),
  emotions: JourneyPhaseEmotionProfileSchema.optional(),
});

/**
 * Formal user journey — phases, touchpoints, emotions, and goal for simulation and JTBD linking.
 * Storyboard beats and flow graphs live in `@local-hosting/twinfile-story/narrative` (`scenes`, `arcTemplate`).
 */
export const UserJourneySchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    /** Journey situation/context — scopes which JTBD jobs are accomplishable per phase. */
    situation: z.string().min(1).optional(),
    userTypeId: UserTypeIdSchema,
    journeyGoal: z.string().min(1),
    phases: z.array(UserJourneyPhaseSchema).min(1),
    touchpointGraph: TouchpointGraphSpecSchema.optional(),
  })
  .describe(
    'User journey: situation/context, ordered phases with touchpoints, emotions, and journey goal.',
  );

/** Customer-family user types — lead, prospect, and customer under abstract user. */
export const CustomerFamilyUserTypeIdSchema = UserKindSchema;

/** Customer journey — a user journey scoped to a customer-family user type. */
export const CustomerJourneySchema = UserJourneySchema.extend({
  userTypeId: CustomerFamilyUserTypeIdSchema,
}).describe('Customer journey — UserJourney for lead, prospect, or customer types.');

export const UserJourneyCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    methodId: z.string().min(1).optional(),
    journeys: z.array(UserJourneySchema).min(1),
  })
  .describe('Catalog of user journeys, optionally method-scoped.');

export const CustomerJourneyCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    methodId: z.string().min(1).optional(),
    journeys: z.array(CustomerJourneySchema).min(1),
  })
  .describe('Catalog of customer-family journeys.');

export const ActiveJourneyEngagementSchema = z.object({
  journeyId: z.string().min(1),
  phaseId: z.string().min(1),
  weight: z.number().min(0).max(1).optional(),
  primary: z.boolean().optional(),
});

export const UserJourneyEngagementSchema = z.object({
  userTypeId: UserTypeIdSchema,
  engagements: z.array(ActiveJourneyEngagementSchema).min(1),
});

export const JourneyMapJobEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  situation: z.string().min(1),
  motivation: z.string().min(1),
  desiredOutcome: z.string().min(1),
});

export const JourneyMapPhaseEntrySchema = z.object({
  phaseId: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
  goal: z.string().min(1),
  situation: z.string().min(1).optional(),
  touchpointIds: z.array(z.string().min(1)).default([]),
  accomplishableJobIds: z.array(z.string().min(1)).default([]),
  accomplishableJobs: z.array(JourneyMapJobEntrySchema).default([]),
  emotions: JourneyPhaseEmotionProfileSchema.optional(),
  active: z.boolean().optional(),
});

export const JourneyMapSchema = z.object({
  journeyId: z.string().min(1),
  label: z.string().min(1),
  situation: z.string().min(1).optional(),
  journeyGoal: z.string().min(1),
  userTypeId: UserTypeIdSchema,
  phases: z.array(JourneyMapPhaseEntrySchema).min(1),
  currentPhaseId: z.string().min(1).optional(),
  activeAccomplishableJobIds: z.array(z.string().min(1)).default([]),
  activeAccomplishableJobs: z.array(JourneyMapJobEntrySchema).default([]),
});

export const UserJourneyMapSchema = z.object({
  userTypeId: UserTypeIdSchema,
  engagements: z.array(ActiveJourneyEngagementSchema).min(1),
  journeyMaps: z.array(JourneyMapSchema).min(1),
  combinedAccomplishableJobIds: z.array(z.string().min(1)).default([]),
  combinedAccomplishableJobs: z.array(JourneyMapJobEntrySchema).default([]),
});

export type JourneyEmotionValence = z.infer<typeof JourneyEmotionValenceSchema>;
export type JourneyPhaseEmotionProfile = z.infer<typeof JourneyPhaseEmotionProfileSchema>;
export type JourneyPhaseRef = z.infer<typeof JourneyPhaseRefSchema>;
export type UserJourneyPhase = z.infer<typeof UserJourneyPhaseSchema>;
export type UserJourney = z.infer<typeof UserJourneySchema>;
export type CustomerFamilyUserTypeId = z.infer<typeof CustomerFamilyUserTypeIdSchema>;
export type CustomerJourney = z.infer<typeof CustomerJourneySchema>;
export type UserJourneyCatalog = z.infer<typeof UserJourneyCatalogSchema>;
export type CustomerJourneyCatalog = z.infer<typeof CustomerJourneyCatalogSchema>;
export type ActiveJourneyEngagement = z.infer<typeof ActiveJourneyEngagementSchema>;
export type UserJourneyEngagement = z.infer<typeof UserJourneyEngagementSchema>;
export type JourneyMapJobEntry = z.infer<typeof JourneyMapJobEntrySchema>;
export type JourneyMapPhaseEntry = z.infer<typeof JourneyMapPhaseEntrySchema>;
export type JourneyMap = z.infer<typeof JourneyMapSchema>;
export type UserJourneyMap = z.infer<typeof UserJourneyMapSchema>;
