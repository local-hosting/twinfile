import { z } from 'zod';
import { PsychographicSegmentIdSchema } from '@local-hosting/twinfile-character/persona/people/customer/profile/customer-ids.js';
import { JourneyPhaseRefSchema } from '@local-hosting/twinfile-character/persona/journey/user-journey.schema.js';
import { HeartDimensionIdSchema } from '../schemas/heart-dimension-id.schema.js';
import {
  VisitationGoalSchema,
  VisitationSubGoalSchema,
} from '@local-hosting/twinfile-character/persona/journey/touchpoints.schema.js';

export const JobGranularitySchema = z.enum(['theme', 'story']);

export const JobAudienceScopeSchema = z.enum(['universal', 'segmented']);

export const JobDeliveryStatusSchema = z.enum(['available', 'planned']);

/** Canonical JTBD progress story — situation, motivation, desired outcome. */
export const JobDefinitionSchema = z
  .object({
    id: z.string().min(1).describe('Stable job identifier.'),
    label: z.string().min(1).describe('Short job title.'),
    granularity: JobGranularitySchema.optional().describe(
      'Theme jobs roll up progress; story jobs are atomic need statements. Defaults to theme.',
    ),
    parentJobId: z
      .string()
      .min(1)
      .optional()
      .describe('Parent theme job id when granularity is story.'),
    audienceScope: JobAudienceScopeSchema.optional().describe(
      'Universal jobs apply to all users; segmented jobs target segmentIds.',
    ),
    touchpointIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Touchpoint or channel ids that can satisfy this job.'),
    featureLabel: z
      .string()
      .min(1)
      .optional()
      .describe('Product feature shorthand for mental-model matrix cells.'),
    deliveryStatus: JobDeliveryStatusSchema.optional().describe(
      'Whether the capability exists today or is planned.',
    ),
    situation: z
      .string()
      .min(1)
      .describe('When / context — the circumstance triggering progress.'),
    motivation: z
      .string()
      .min(1)
      .describe('I want — the functional or emotional motivation.'),
    desiredOutcome: z
      .string()
      .min(1)
      .describe('So that — the measurable progress or outcome sought.'),
    jobStatement: z
      .string()
      .min(1)
      .optional()
      .describe('Full When / I want / so that sentence when authored as one string.'),
    stage: z
      .string()
      .min(1)
      .optional()
      .describe('Journey or lifecycle stage where this job is salient.'),
    journeyPhaseRefs: z
      .array(JourneyPhaseRefSchema)
      .optional()
      .describe('Journey phases where this job is accomplishable when journey map is authoritative.'),
    segmentIds: z
      .array(PsychographicSegmentIdSchema)
      .optional()
      .describe('Psychographic segment ids this job targets.'),
    obstacleIds: z
      .array(z.string().min(1))
      .default([])
      .describe('Obstacle ids blocking progress on this job — complement of the desired outcome.'),
    painPointIds: z
      .array(z.string().min(1))
      .default([])
      .describe('Customer catalog pain point ids this job resolves.'),
    productContext: z
      .string()
      .min(1)
      .optional()
      .describe('Product or offer context relevant to the job.'),
    heartDimensionId: HeartDimensionIdSchema.optional().describe(
      'HEART dimension this job most directly advances when completed.',
    ),
    visitationGoal: VisitationGoalSchema.optional().describe(
      'MdVVP Five C goal this job advances when completed.',
    ),
    visitationSubGoal: VisitationSubGoalSchema.optional().describe(
      'MdVVP sub-goal within the Five C category.',
    ),
    goalEventIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Instrumentation goal events that indicate progress on this job.'),
  })
  .describe('Jobs-to-be-done progress story linking situation, motivation, and outcome.');

export const JtbdCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0').describe('JTBD catalog format version.'),
    methodId: z
      .string()
      .min(1)
      .optional()
      .describe('Method id when the catalog is method-scoped.'),
    jobs: z.array(JobDefinitionSchema).min(1).describe('Job definitions in this catalog.'),
    kpiLinks: z
      .record(z.string().min(1), z.array(z.string().min(1)))
      .optional()
      .describe('Maps each job id to metric ids from a MethodSpec registry.'),
    goalEventLinks: z
      .record(z.string().min(1), z.array(z.string().min(1)))
      .optional()
      .describe('Maps each job id to goal event ids that indicate job progress.'),
    universalSegmentId: z
      .string()
      .min(1)
      .optional()
      .describe('Optional sentinel segment id meaning all users (preset-defined).'),
  })
  .describe('Catalog of jobs-to-be-done linked to a measurement method.');

/** Links each job id to metric ids from a MethodSpec registry. */
export const JtbdKpiMapSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  links: z.record(z.string().min(1), z.array(z.string().min(1))),
});

export type JobGranularity = z.infer<typeof JobGranularitySchema>;
export type JobAudienceScope = z.infer<typeof JobAudienceScopeSchema>;
export type JobDeliveryStatus = z.infer<typeof JobDeliveryStatusSchema>;
export type JobDefinition = z.infer<typeof JobDefinitionSchema>;
export type JtbdCatalog = z.infer<typeof JtbdCatalogSchema>;
export type JtbdKpiMap = z.infer<typeof JtbdKpiMapSchema>;
