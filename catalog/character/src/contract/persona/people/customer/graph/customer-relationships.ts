import { z } from 'zod';
import { ThinkingStyleIdSchema, ThinkingStyleListSchema } from '../../../empathy/think/thinking-style.js';
import {
  CustomerIntentIdSchema,
  FocusAreaIdSchema,
  PsychographicSegmentIdSchema,
  ShoppingMethodIdSchema,
  VisitOpportunityScenarioKeySchema,
} from '../profile/customer-ids.js';
import { HeartDimensionIdSchema } from '../../../shared/heart-dimension-id.schema.js';
import {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from '../profile/engagement-ids.js';
import { UserKindSchema, UserTypeIdSchema } from '../profile/user-type-definition.js';

export {
  CustomerIntentIdSchema,
  DefaultCustomerIntentIdSchema,
  EmpathyJourneyPhaseIdSchema,
  FocusAreaIdSchema,
  PsychographicSegmentIdSchema,
  ShoppingMethodIdSchema,
  VisitOpportunityScenarioKeySchema,
} from '../profile/customer-ids.js';
export type {
  CustomerIntentId,
  DefaultCustomerIntentId,
  EmpathyJourneyPhaseId,
  FocusAreaId,
  PsychographicSegmentId,
  VisitOpportunityScenarioKey,
} from '../profile/customer-ids.js';

export const CognitionLayerKindSchema = z.enum([
  'identity',
  'context',
  'cognition',
  'situational',
  'measurement',
]);

export const VISIT_OPPORTUNITY_BY_SCENARIO_KEY = {
  Fixer: 'fixer',
  Prospect: 'prospect',
  Upgrader: 'upgrader',
} as const satisfies Record<
  z.infer<typeof VisitOpportunityScenarioKeySchema>,
  z.infer<typeof VisitOpportunityIdSchema>
>;

export const MentalModelByFocusMapSchema = z.partialRecord(FocusAreaIdSchema, ThinkingStyleListSchema);
export const MentalModelByLevelMapSchema = z.partialRecord(EngagementLevelIdSchema, ThinkingStyleListSchema);
export const MentalModelByIntentMapSchema = z.partialRecord(CustomerIntentIdSchema, ThinkingStyleListSchema);

export const StrategyScenarioTitlesSchema = z.partialRecord(
  VisitOpportunityScenarioKeySchema,
  z.string().min(1),
);

export const StrategyScenarioMotivationsSchema = z.partialRecord(
  VisitOpportunityScenarioKeySchema,
  z.array(z.string().min(1)),
);

/** Typed facet slots that compose a psychographic segment profile. */
export const SegmentFacetKindSchema = z.enum([
  'overview',
  'attitudes',
  'behavior',
  'emotions',
  'empathy',
  'mental_model',
  'services',
  'strategy',
]);

export const SegmentEngagementLevelSourceSchema = z.enum([
  'objective',
  'visit_frequency',
  'mental_model_level',
]);

export const SegmentFocusMentalModelEdgeSchema = z.object({
  kind: z.literal('segment_focus_mental_model'),
  segmentId: PsychographicSegmentIdSchema,
  focusAreaId: FocusAreaIdSchema,
  thinkingStyleIds: z.array(ThinkingStyleIdSchema),
});

export const SegmentIntentMentalModelEdgeSchema = z.object({
  kind: z.literal('segment_intent_mental_model'),
  segmentId: PsychographicSegmentIdSchema,
  intentId: CustomerIntentIdSchema,
  thinkingStyleIds: z.array(ThinkingStyleIdSchema),
});

export const SegmentLevelMentalModelEdgeSchema = z.object({
  kind: z.literal('segment_level_mental_model'),
  segmentId: PsychographicSegmentIdSchema,
  engagementLevelId: EngagementLevelIdSchema,
  thinkingStyleIds: z.array(ThinkingStyleIdSchema),
});

export const SegmentObjectiveEdgeSchema = z.object({
  kind: z.literal('segment_objective'),
  segmentId: PsychographicSegmentIdSchema,
  intentId: CustomerIntentIdSchema,
  engagementLevelIds: z.array(EngagementLevelIdSchema),
});

export const SegmentScenarioEdgeSchema = z.object({
  kind: z.literal('segment_scenario'),
  segmentId: PsychographicSegmentIdSchema,
  scenarioKey: VisitOpportunityScenarioKeySchema,
  opportunityId: VisitOpportunityIdSchema,
});

export const SegmentFacetEdgeSchema = z.object({
  kind: z.literal('segment_facet'),
  segmentId: PsychographicSegmentIdSchema,
  facetKind: SegmentFacetKindSchema,
});

export const SegmentEngagementLevelEdgeSchema = z.object({
  kind: z.literal('segment_engagement_level'),
  segmentId: PsychographicSegmentIdSchema,
  engagementLevelId: EngagementLevelIdSchema,
  sources: z.array(SegmentEngagementLevelSourceSchema).min(1),
});

export const SegmentUserKindEdgeSchema = z.object({
  kind: z.literal('segment_user_kind'),
  segmentId: PsychographicSegmentIdSchema,
  userKind: UserKindSchema,
  engagementLevelIds: z.array(EngagementLevelIdSchema).min(1),
});

export const SegmentExemplarPersonaEdgeSchema = z.object({
  kind: z.literal('segment_exemplar_persona'),
  segmentId: PsychographicSegmentIdSchema,
  personaId: z.string().min(1),
});

export const PersonaSegmentAffinityEdgeSchema = z.object({
  kind: z.literal('persona_segment_affinity'),
  personaId: z.string().min(1),
  segmentId: PsychographicSegmentIdSchema,
  weight: z.number().min(0).max(1).optional(),
});

export const PersonaRelationshipEdgeSchema = z.discriminatedUnion('kind', [
  PersonaSegmentAffinityEdgeSchema,
]);

export const PersonaRelationshipGraphSchema = z.object({
  personaId: z.string().min(1),
  edges: z.array(PersonaRelationshipEdgeSchema),
});

export const SegmentPainPointEdgeSchema = z.object({
  kind: z.literal('segment_pain_point'),
  segmentId: PsychographicSegmentIdSchema,
  painPointId: z.string().min(1),
});

export const CatalogEngagementUserKindEdgeSchema = z.object({
  kind: z.literal('catalog_engagement_user_kind'),
  engagementLevelId: EngagementLevelIdSchema,
  userKind: UserKindSchema,
});

export const CatalogIntentOpportunityEdgeSchema = z.object({
  kind: z.literal('catalog_intent_opportunity'),
  intentId: CustomerIntentIdSchema,
  opportunityId: VisitOpportunityIdSchema,
});

export const CatalogUserTypeEngagementEdgeSchema = z.object({
  kind: z.literal('catalog_user_type_engagement'),
  userTypeId: UserTypeIdSchema,
  engagementLevelId: EngagementLevelIdSchema,
});

export const CatalogLevelShoppingMethodEdgeSchema = z.object({
  kind: z.literal('catalog_level_shopping_method'),
  engagementLevelId: EngagementLevelIdSchema,
  shoppingMethodId: ShoppingMethodIdSchema,
  role: z.enum(['primary', 'secondary']),
});

export const CatalogLevelLifecycleStageEdgeSchema = z.object({
  kind: z.literal('catalog_level_lifecycle_stage'),
  engagementLevelId: EngagementLevelIdSchema,
  lifecycleStageId: LifecycleStageIdSchema,
});

export const CatalogFocusDriverCategoryEdgeSchema = z.object({
  kind: z.literal('catalog_focus_driver_category'),
  focusAreaId: FocusAreaIdSchema,
  driverCategoryId: z.string().min(1),
});

export const CatalogLifecyclePainPointEdgeSchema = z.object({
  kind: z.literal('catalog_lifecycle_pain_point'),
  lifecycleStageId: LifecycleStageIdSchema,
  painPointId: z.string().min(1),
});

export const CatalogLifecycleHeartDimensionEdgeSchema = z.object({
  kind: z.literal('catalog_lifecycle_heart_dimension'),
  lifecycleStageId: LifecycleStageIdSchema,
  heartDimensionId: HeartDimensionIdSchema,
});

export const PainPointLeadsToJobEdgeSchema = z.object({
  kind: z.literal('pain_point_leads_to_job'),
  painPointId: z.string().min(1),
  jobId: z.string().min(1),
});

export const ObstacleBlocksJobEdgeSchema = z.object({
  kind: z.literal('obstacle_blocks_job'),
  obstacleId: z.string().min(1),
  jobId: z.string().min(1),
});

export const JobMeasuresMetricEdgeSchema = z.object({
  kind: z.literal('job_measures_metric'),
  jobId: z.string().min(1),
  metricId: z.string().min(1),
});

export const JtbdRelationshipEdgeSchema = z.discriminatedUnion('kind', [
  PainPointLeadsToJobEdgeSchema,
  ObstacleBlocksJobEdgeSchema,
  JobMeasuresMetricEdgeSchema,
]);

export const JtbdRelationshipGraphSchema = z.object({
  edges: z.array(JtbdRelationshipEdgeSchema),
});

export const SegmentRelationshipEdgeSchema = z.discriminatedUnion('kind', [
  SegmentFocusMentalModelEdgeSchema,
  SegmentIntentMentalModelEdgeSchema,
  SegmentLevelMentalModelEdgeSchema,
  SegmentObjectiveEdgeSchema,
  SegmentScenarioEdgeSchema,
  SegmentFacetEdgeSchema,
  SegmentEngagementLevelEdgeSchema,
  SegmentUserKindEdgeSchema,
  SegmentExemplarPersonaEdgeSchema,
  SegmentPainPointEdgeSchema,
]);

export const CatalogRelationshipEdgeSchema = z.discriminatedUnion('kind', [
  CatalogEngagementUserKindEdgeSchema,
  CatalogIntentOpportunityEdgeSchema,
  CatalogUserTypeEngagementEdgeSchema,
  CatalogLevelShoppingMethodEdgeSchema,
  CatalogLevelLifecycleStageEdgeSchema,
  CatalogFocusDriverCategoryEdgeSchema,
  CatalogLifecyclePainPointEdgeSchema,
  CatalogLifecycleHeartDimensionEdgeSchema,
]);

export const SegmentRelationshipGraphSchema = z.object({
  segmentId: PsychographicSegmentIdSchema,
  edges: z.array(SegmentRelationshipEdgeSchema),
});

export const CatalogRelationshipGraphSchema = z.object({
  edges: z.array(CatalogRelationshipEdgeSchema),
});

export const REQUIRED_SEGMENT_FACET_KINDS = [
  'overview',
  'attitudes',
  'behavior',
  'emotions',
  'empathy',
  'mental_model',
  'strategy',
] as const satisfies readonly SegmentFacetKind[];

export type CognitionLayerKind = z.infer<typeof CognitionLayerKindSchema>;
export type SegmentFacetKind = z.infer<typeof SegmentFacetKindSchema>;
export type SegmentEngagementLevelSource = z.infer<typeof SegmentEngagementLevelSourceSchema>;
export type CatalogLevelShoppingMethodEdge = z.infer<typeof CatalogLevelShoppingMethodEdgeSchema>;
export type CatalogLevelLifecycleStageEdge = z.infer<typeof CatalogLevelLifecycleStageEdgeSchema>;
export type CatalogFocusDriverCategoryEdge = z.infer<typeof CatalogFocusDriverCategoryEdgeSchema>;
export type CatalogLifecyclePainPointEdge = z.infer<typeof CatalogLifecyclePainPointEdgeSchema>;
export type CatalogLifecycleHeartDimensionEdge = z.infer<
  typeof CatalogLifecycleHeartDimensionEdgeSchema
>;
export type PainPointLeadsToJobEdge = z.infer<typeof PainPointLeadsToJobEdgeSchema>;
export type ObstacleBlocksJobEdge = z.infer<typeof ObstacleBlocksJobEdgeSchema>;
export type JobMeasuresMetricEdge = z.infer<typeof JobMeasuresMetricEdgeSchema>;
export type JtbdRelationshipEdge = z.infer<typeof JtbdRelationshipEdgeSchema>;
export type JtbdRelationshipGraph = z.infer<typeof JtbdRelationshipGraphSchema>;
export type SegmentRelationshipEdge = z.infer<typeof SegmentRelationshipEdgeSchema>;
export type CatalogRelationshipEdge = z.infer<typeof CatalogRelationshipEdgeSchema>;
export type SegmentRelationshipGraph = z.infer<typeof SegmentRelationshipGraphSchema>;
export type PersonaSegmentAffinityEdge = z.infer<typeof PersonaSegmentAffinityEdgeSchema>;
export type PersonaRelationshipEdge = z.infer<typeof PersonaRelationshipEdgeSchema>;
export type PersonaRelationshipGraph = z.infer<typeof PersonaRelationshipGraphSchema>;
export type CatalogRelationshipGraph = z.infer<typeof CatalogRelationshipGraphSchema>;
