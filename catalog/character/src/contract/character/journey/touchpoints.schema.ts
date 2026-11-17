import { z } from 'zod';

/**
 * Touchpoint modality — mapped to MdVVP spatial through synchronous dimensions.
 * Spans physical architectural space through digital surfaces and immersive media.
 */
export const TouchpointModalitySchema = z.enum([
  'physical_space',
  'mobile',
  'web',
  'vr',
  'ar',
  'mr',
  'game',
  'stream',
  'social',
  'wearable',
  'kiosk',
  'broadcast',
]);

/** Whether the touchpoint is experienced in the physical world, digitally, or both. */
export const TouchpointLocusSchema = z.enum(['physical', 'digital', 'blended']);

/** Role within a hybrid product ecosystem (hub, entry point, satellite). */
export const TouchpointRoleSchema = z.enum([
  'hub',
  'entry_point',
  'satellite',
  'onsite_companion',
  'blended_bridge',
]);

/** Where the experience is accessed — on-site vs remote (MdVVP location dimension). */
export const LocationContextSchema = z.enum(['on_site', 'remote', 'hybrid']);

/** How journeys connect across touchpoints (Benford hybrid structure). */
export const JourneyTransitionSchema = z.enum([
  'adjacent',
  'connected',
  'overlaid',
]);

export const TemporalModeSchema = z.enum([
  'synchronous',
  'asynchronous',
  'episodic',
]);

/** Spatial presence progression (Riemer & Seymour; Table 1). */
export const SpatialPresenceSchema = z.enum(['watch', 'move', 'use']);

/** Social presence progression (Riemer & Seymour; Table 1). */
export const SocialPresenceSchema = z.enum(['none', 'watch', 'interact']);

/** MdVVP Five C's — high-level visitation goals. */
export const VisitationGoalSchema = z.enum([
  'converge',
  'consume',
  'contribute',
  'collect',
  'connect',
]);

/** MdVVP sub-goals (two per high-level goal). */
export const VisitationSubGoalSchema = z.enum([
  'visit',
  'explore',
  'watch',
  'learn',
  'ideas',
  'things',
  'personalize',
  'play',
  'business',
  'friends',
]);

/** Long-horizon product journey stages (MdVVP Figure 6). */
export const ProductJourneyStageSchema = z.enum([
  'discovery',
  'onboarding',
  'scaffolding',
  'progression',
  'endgame',
]);

/** Audience depth metaphor — skimmers, swimmers, divers. */
export const EngagementDepthSchema = z.enum(['skim', 'swim', 'dive']);

/** Riemer & Seymour virtual visitation capture metrics. */
export const VirtualVisitationMetricSchema = z.enum([
  'view',
  'visit',
  'engagement',
  'involvement',
]);

/** Retail / service journey phase (pre-visit → on-site → post-visit). */
export const CustomerJourneyPhaseSchema = z.enum([
  'pre_visit',
  'on_site',
  'post_visit',
]);

/**
 * Primary touchpoint taxonomy — how the experience is delivered.
 * Catalogs partition touchpoints by type (venue / mobile / web / …).
 */
export const TouchpointTypeSchema = z.enum([
  'social',
  'venue',
  'mobile',
  'web',
  'game',
  'streaming',
  'headset',
  'wearable',
]);

/**
 * Channel surface from journey catalogs — maps to modality + locus.
 * Aligns with media / store / website / social / app / map contexts.
 */
export const TouchpointChannelSchema = z.enum([
  'media',
  'store',
  'website',
  'social',
  'app',
  'map',
]);

/** Self-directed visitor intent at a touchpoint. */
export const VisitorIntentSchema = z.enum([
  'learn',
  'purchase',
  'upgrade',
  'setup',
  'fix',
  'switch',
  'rejoin',
  'downgrade',
  'cancel',
]);

/** Funnel stage tags commonly attached to journey touchpoints. */
export const TouchpointFunnelStageSchema = z.enum([
  'awareness',
  'evaluation',
  'adoption',
  'activation',
  'expansion',
  'advocacy',
]);

export const TouchpointHeartDimensionSchema = z.enum([
  'happiness',
  'engagement',
  'adoption',
  'retention',
  'task-success',
]);

export const TouchpointDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: TouchpointTypeSchema,
  modality: TouchpointModalitySchema,
  locus: TouchpointLocusSchema,
  role: TouchpointRoleSchema.optional(),
  locationContext: LocationContextSchema.optional(),
  temporalMode: TemporalModeSchema.optional(),
  spatialPresence: SpatialPresenceSchema.optional(),
  socialPresence: SocialPresenceSchema.optional(),
  goals: z.array(VisitationGoalSchema).optional(),
  subGoals: z.array(VisitationSubGoalSchema).optional(),
  journeyStages: z.array(ProductJourneyStageSchema).optional(),
  engagementDepths: z.array(EngagementDepthSchema).optional(),
  parentTouchpointId: z.string().min(1).optional(),
  linkedMetricIds: z.array(z.string().min(1)).optional(),
  description: z.string().min(1).optional(),
  journeyPhase: CustomerJourneyPhaseSchema.optional(),
  zone: z.string().min(1).optional(),
  channel: TouchpointChannelSchema.optional(),
  visitorIntents: z.array(VisitorIntentSchema).optional(),
  funnelStages: z.array(TouchpointFunnelStageSchema).optional(),
  durationWeight: z.number().positive().optional(),
  heartDimension: TouchpointHeartDimensionSchema.optional(),
});

export const TouchpointLinkSchema = z.object({
  fromTouchpointId: z.string().min(1),
  toTouchpointId: z.string().min(1),
  transition: JourneyTransitionSchema,
  label: z.string().min(1).optional(),
});

export const TouchpointGraphSpecSchema = z
  .object({
    hubTouchpointId: z
      .string()
      .min(1)
      .optional()
      .describe('Primary hub touchpoint id when the journey is hub-and-spoke.'),
    touchpoints: z
      .array(TouchpointDefinitionSchema)
      .min(1)
      .describe('Touchpoint nodes in the journey graph.'),
    links: z
      .array(TouchpointLinkSchema)
      .default([])
      .describe('Directed edges between touchpoints.'),
  })
  .describe('Journey touchpoint graph for visitation or omnichannel methods.');

export type TouchpointType = z.infer<typeof TouchpointTypeSchema>;
export type TouchpointModality = z.infer<typeof TouchpointModalitySchema>;
export type TouchpointLocus = z.infer<typeof TouchpointLocusSchema>;
export type TouchpointRole = z.infer<typeof TouchpointRoleSchema>;
export type LocationContext = z.infer<typeof LocationContextSchema>;
export type JourneyTransition = z.infer<typeof JourneyTransitionSchema>;
export type TemporalMode = z.infer<typeof TemporalModeSchema>;
export type SpatialPresence = z.infer<typeof SpatialPresenceSchema>;
export type SocialPresence = z.infer<typeof SocialPresenceSchema>;
export type VisitationGoal = z.infer<typeof VisitationGoalSchema>;
export type VisitationSubGoal = z.infer<typeof VisitationSubGoalSchema>;
export type ProductJourneyStage = z.infer<typeof ProductJourneyStageSchema>;
export type EngagementDepth = z.infer<typeof EngagementDepthSchema>;
export type VirtualVisitationMetric = z.infer<typeof VirtualVisitationMetricSchema>;
export type CustomerJourneyPhase = z.infer<typeof CustomerJourneyPhaseSchema>;
export type TouchpointChannel = z.infer<typeof TouchpointChannelSchema>;
export type VisitorIntent = z.infer<typeof VisitorIntentSchema>;
export type TouchpointFunnelStage = z.infer<typeof TouchpointFunnelStageSchema>;
export type TouchpointHeartDimension = z.infer<typeof TouchpointHeartDimensionSchema>;
export type TouchpointDefinition = z.infer<typeof TouchpointDefinitionSchema>;
export type TouchpointLink = z.infer<typeof TouchpointLinkSchema>;
export type TouchpointGraphSpec = z.infer<typeof TouchpointGraphSpecSchema>;
