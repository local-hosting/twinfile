import type { JobDefinition } from '@local-hosting/twinfile-character/jsm/catalog/jtbd.schema.js';
import type { KpiDefinition } from '../../../situations/types/kpi-definition-wire.js';
import { HeartDimensionIdSchema } from '../../shared/heart-dimension-id.schema.js';
import {
  CustomerCatalogSchema,
  PsychographicSegmentProfileSchema,
  PsychographicSegmentCatalogSchema,
  PsychographicSegmentSummarySchema,
  type CustomerCatalog,
  type CustomerCatalogOverlay,
  type CustomerPainPointDefinition,
  type PsychographicSegmentCatalog,
  type PsychographicSegmentProfile,
  type PsychographicSegmentSummary,
} from './profile/customer.js';
import {
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
  type VisitOpportunityId,
} from './profile/engagement-ids.js';
import { DEFAULT_CUSTOMER_CATALOG } from '../audience/defaults/customer-catalog.js';
import { loadGeneralFocusAreaCatalog } from '../audience/load-general-focus-area-catalog.js';

function driverCategoryIdsFromRegistry(metrics: readonly KpiDefinition[]): Set<string> {
  const ids = new Set<string>();
  for (const row of metrics) {
    ids.add(row.id);
    if (typeof row.treeNodeId === 'string') ids.add(row.treeNodeId);
    if (typeof row.layer === 'string') ids.add(row.layer);
    if (row.heartDimension) ids.add(row.heartDimension);
  }
  return ids;
}



const LEGACY_OPPORTUNITY_LABELS: Record<string, VisitOpportunityId> = {
  prospect: 'prospect',
  fixer: 'fixer',
  upgrader: 'upgrader',
  upgrade: 'upgrader',
  reclaimer: 'reclaimer',
  retention: 'retention',
};

const OPPORTUNITY_LABELS: Record<VisitOpportunityId, string> = {
  prospect: 'Prospect',
  fixer: 'Fixer',
  upgrader: 'Upgrade',
  reclaimer: 'Reclaimer',
  retention: 'Retention',
};

export interface CustomerValidationIssue {
  code:
    | 'unknown_intent'
    | 'unknown_opportunity'
    | 'unknown_level'
    | 'unknown_method'
    | 'unknown_user_type'
    | 'unknown_touchpoint'
    | 'unknown_job_opportunity'
    | 'unknown_metric'
    | 'unknown_pain_point'
    | 'unknown_pain_point_job'
    | 'unknown_pain_point_segment'
    | 'pain_point_job_mismatch'
    | 'unknown_driver_category'
    | 'unknown_heart_dimension';
  message: string;
  id?: string;
}

export function getDefaultCustomerCatalog(): CustomerCatalog {
  return CustomerCatalogSchema.parse({
    ...DEFAULT_CUSTOMER_CATALOG,
    focusAreas: loadGeneralFocusAreaCatalog().focusAreas,
  });
}

export function parseCustomerCatalog(input: unknown): CustomerCatalog {
  return CustomerCatalogSchema.parse(input);
}


export function enrichEngagementLevelsFromSegments(
  catalog: CustomerCatalog,
  profiles: readonly PsychographicSegmentProfile[],
): CustomerCatalog {
  const intentsByLevel = new Map<string, Set<string>>();

  for (const profile of profiles) {
    for (const objective of profile.objectives) {
      for (const levelId of objective.validLevelIds) {
        const bucket = intentsByLevel.get(levelId) ?? new Set<string>();
        bucket.add(objective.intentId);
        intentsByLevel.set(levelId, bucket);
      }
    }
  }

  if (intentsByLevel.size === 0) return catalog;

  return parseCustomerCatalog({
    ...catalog,
    engagementLevels: catalog.engagementLevels.map((level) => {
      const extra = intentsByLevel.get(level.id);
      if (!extra?.size) return level;
      return {
        ...level,
        validIntentIds: [...new Set([...level.validIntentIds, ...extra])],
      };
    }),
  });
}

export function parsePsychographicSegmentProfile(
  input: unknown,
): PsychographicSegmentProfile {
  return PsychographicSegmentProfileSchema.parse(input);
}

export function parsePsychographicSegmentCatalog(
  input: unknown,
): PsychographicSegmentCatalog {
  return PsychographicSegmentCatalogSchema.parse(input);
}

/** @deprecated Audience archetype presets removed — returns empty segment catalog. */
export function getDefaultArchetypeCatalog(): PsychographicSegmentCatalog {
  return PsychographicSegmentCatalogSchema.parse({ specVersion: '1.0', segments: [] });
}

function mergeById<T extends { id: string }>(
  base: readonly T[],
  overlay: readonly T[] | undefined,
): T[] {
  if (!overlay?.length) return [...base];
  const map = new Map(base.map((row) => [row.id, { ...row }]));
  for (const row of overlay) {
    map.set(row.id, { ...map.get(row.id), ...row });
  }
  return [...map.values()];
}

export function segmentSummaryFromProfile(
  profile: PsychographicSegmentProfile,
): PsychographicSegmentSummary {
  const overview = profile.overview ?? {};
  const journeyPace = overview.journeyPace;

  return PsychographicSegmentSummarySchema.parse({
    id: profile.id,
    label: typeof overview.name === 'string' ? overview.name : profile.id,
    description: typeof overview.description === 'string' ? overview.description : undefined,
    percentage: typeof overview.percentage === 'number' ? overview.percentage : undefined,
    mindset: typeof overview.mindset === 'string' ? overview.mindset : undefined,
    journeyPace:
      journeyPace === 'slow' || journeyPace === 'medium' || journeyPace === 'fast'
        ? journeyPace
        : undefined,
    pullQuote: typeof overview.pullQuote === 'string' ? overview.pullQuote : undefined,
  });
}

export function segmentSummariesFromProfiles(
  profiles: readonly PsychographicSegmentProfile[],
): PsychographicSegmentSummary[] {
  return profiles.map(segmentSummaryFromProfile);
}

export function mergeCustomerCatalog(
  base: CustomerCatalog,
  overlay: CustomerCatalogOverlay,
): CustomerCatalog {
  return parseCustomerCatalog({
    ...base,
    methodId: overlay.methodId ?? base.methodId,
    lifecycleStages: mergeById(base.lifecycleStages, overlay.lifecycleStages),
    engagementLevels: mergeById(base.engagementLevels, overlay.engagementLevels),
    shoppingMethods: mergeById(base.shoppingMethods, overlay.shoppingMethods),
    focusAreas: overlay.focusAreas ?? base.focusAreas,
    psychographicSegments: overlay.psychographicSegments ?? base.psychographicSegments,
    painPoints: mergeById(base.painPoints, overlay.painPoints),
  });
}

export function normalizeVisitOpportunityId(
  value: string,
): VisitOpportunityId | undefined {
  const key = value.trim().toLowerCase();
  const mapped = LEGACY_OPPORTUNITY_LABELS[key];
  if (mapped) return mapped;
  const parsed = VisitOpportunityIdSchema.safeParse(key);
  return parsed.success ? parsed.data : undefined;
}

export function visitOpportunityLabel(id: VisitOpportunityId): string {
  return OPPORTUNITY_LABELS[id];
}

export function jobVisitOpportunityIds(job: JobDefinition): VisitOpportunityId[] {
  if (!job.segmentIds?.length) return [];
  const ids = new Set<VisitOpportunityId>();
  for (const segmentId of job.segmentIds) {
    const normalized = normalizeVisitOpportunityId(segmentId);
    if (normalized) ids.add(normalized);
  }
  return [...ids];
}

export function validateCustomerCatalog(
  catalog: CustomerCatalog,
  options: {
    jobs?: readonly JobDefinition[];
    metrics?: readonly KpiDefinition[];
    touchpointIds?: ReadonlySet<string>;
  } = {},
): { valid: boolean; issues: CustomerValidationIssue[] } {
  const issues: CustomerValidationIssue[] = [];
  const userTypeIds = new Set(catalog.userTypes.map((row) => row.id));
  const opportunityIds = new Set(catalog.opportunities.map((row) => row.id));
  const intentIds = new Set(catalog.intents.map((row) => row.id));
  const levelIds = new Set(catalog.engagementLevels.map((row) => row.id));
  const methodIds = new Set(catalog.shoppingMethods.map((row) => row.id));
  const painPointIds = new Set(catalog.painPoints.map((row) => row.id));
  const lifecycleStageIds = new Set(catalog.lifecycleStages.map((row) => row.id));
  const segmentIds = new Set(catalog.psychographicSegments.map((row) => row.id));
  const jobIds = options.jobs ? new Set(options.jobs.map((job) => job.id)) : undefined;

  for (const userType of catalog.userTypes) {
    if (userType.parentTypeId && !userTypeIds.has(userType.parentTypeId)) {
      issues.push({
        code: 'unknown_user_type',
        id: userType.parentTypeId,
        message: `User type "${userType.id}" references unknown parent "${userType.parentTypeId}"`,
      });
    }
    for (const intentId of userType.defaultIntentIds) {
      if (!intentIds.has(intentId)) {
        issues.push({
          code: 'unknown_intent',
          id: intentId,
          message: `User type "${userType.id}" references unknown intent "${intentId}"`,
        });
      }
    }
  }

  for (const intent of catalog.intents) {
    if (!opportunityIds.has(intent.opportunityId)) {
      issues.push({
        code: 'unknown_opportunity',
        id: intent.opportunityId,
        message: `Intent "${intent.id}" references unknown opportunity "${intent.opportunityId}"`,
      });
    }
  }

  for (const opportunity of catalog.opportunities) {
    for (const intentId of opportunity.intentIds) {
      if (!intentIds.has(intentId)) {
        issues.push({
          code: 'unknown_intent',
          id: intentId,
          message: `Opportunity "${opportunity.id}" references unknown intent "${intentId}"`,
        });
      }
    }
  }

  for (const level of catalog.engagementLevels) {
    for (const intentId of level.validIntentIds) {
      if (!intentIds.has(intentId)) {
        issues.push({
          code: 'unknown_intent',
          id: intentId,
          message: `Engagement level "${level.id}" references unknown intent "${intentId}"`,
        });
      }
    }
  }

  const levelMethods = catalog.links?.levelShoppingMethods ?? {};
  for (const [levelId, mapping] of Object.entries(levelMethods)) {
    if (!levelIds.has(levelId as CustomerCatalog['engagementLevels'][number]['id'])) {
      issues.push({
        code: 'unknown_level',
        id: levelId,
        message: `Shopping-method mapping references unknown level "${levelId}"`,
      });
    }
    if (!methodIds.has(mapping.primaryMethodId)) {
      issues.push({
        code: 'unknown_method',
        id: mapping.primaryMethodId,
        message: `Level "${levelId}" primary method "${mapping.primaryMethodId}" is undefined`,
      });
    }
    for (const methodId of mapping.secondaryMethodIds) {
      if (!methodIds.has(methodId)) {
        issues.push({
          code: 'unknown_method',
          id: methodId,
          message: `Level "${levelId}" secondary method "${methodId}" is undefined`,
        });
      }
    }
  }

  for (const rule of catalog.links?.intentDerivationRules ?? []) {
    if (!intentIds.has(rule.intentId)) {
      issues.push({
        code: 'unknown_intent',
        id: rule.intentId,
        message: `Intent derivation rule references unknown intent "${rule.intentId}"`,
      });
    }
    if (!methodIds.has(rule.methodId)) {
      issues.push({
        code: 'unknown_method',
        id: rule.methodId,
        message: `Intent derivation rule references unknown method "${rule.methodId}"`,
      });
    }
  }

  for (const stage of catalog.lifecycleStages) {
    for (const painPointId of stage.customerNeeds?.painPointIds ?? []) {
      if (!painPointIds.has(painPointId)) {
        issues.push({
          code: 'unknown_pain_point',
          id: painPointId,
          message: `Lifecycle stage "${stage.id}" references unknown pain point "${painPointId}"`,
        });
      }
    }
  }

  for (const painPoint of catalog.painPoints) {
    for (const stageId of painPoint.lifecycleStageIds) {
      const parsedStageId = LifecycleStageIdSchema.safeParse(stageId);
    if (!parsedStageId.success || !lifecycleStageIds.has(parsedStageId.data)) {
        issues.push({
          code: 'unknown_level',
          id: stageId,
          message: `Pain point "${painPoint.id}" references unknown lifecycle stage "${stageId}"`,
        });
      }
    }
    for (const opportunityId of painPoint.opportunityIds) {
      if (!opportunityIds.has(opportunityId)) {
        issues.push({
          code: 'unknown_opportunity',
          id: opportunityId,
          message: `Pain point "${painPoint.id}" references unknown opportunity "${opportunityId}"`,
        });
      }
    }
    for (const intentId of painPoint.intentIds) {
      if (!intentIds.has(intentId)) {
        issues.push({
          code: 'unknown_intent',
          id: intentId,
          message: `Pain point "${painPoint.id}" references unknown intent "${intentId}"`,
        });
      }
    }
    for (const levelId of painPoint.engagementLevelIds) {
      if (!levelIds.has(levelId)) {
        issues.push({
          code: 'unknown_level',
          id: levelId,
          message: `Pain point "${painPoint.id}" references unknown engagement level "${levelId}"`,
        });
      }
    }
    for (const segmentId of painPoint.segmentIds) {
      if (segmentIds.size > 0 && !segmentIds.has(segmentId)) {
        issues.push({
          code: 'unknown_pain_point_segment',
          id: segmentId,
          message: `Pain point "${painPoint.id}" references unknown segment "${segmentId}"`,
        });
      }
    }
    for (const jobId of painPoint.leadsToJobIds) {
      if (jobIds && !jobIds.has(jobId)) {
        issues.push({
          code: 'unknown_pain_point_job',
          id: jobId,
          message: `Pain point "${painPoint.id}" references unknown job "${jobId}"`,
        });
      }
    }
  }

  if (options.jobs) {
    for (const job of options.jobs) {
      for (const segmentId of job.segmentIds ?? []) {
        const opportunityId = normalizeVisitOpportunityId(segmentId);
        if (!opportunityId || !opportunityIds.has(opportunityId)) {
          issues.push({
            code: 'unknown_job_opportunity',
            id: segmentId,
            message: `Job "${job.id}" references unknown visit opportunity "${segmentId}"`,
          });
        }
      }
      for (const painPointId of job.painPointIds ?? []) {
        if (!painPointIds.has(painPointId)) {
          issues.push({
            code: 'unknown_pain_point',
            id: painPointId,
            message: `Job "${job.id}" references unknown pain point "${painPointId}"`,
          });
        }
      }
    }

    for (const job of options.jobs) {
      for (const painPointId of job.painPointIds ?? []) {
        const painPoint = catalog.painPoints.find((row) => row.id === painPointId);
        if (!painPoint) continue;
        if (!painPoint.leadsToJobIds.includes(job.id)) {
          issues.push({
            code: 'pain_point_job_mismatch',
            id: painPointId,
            message: `Job "${job.id}" lists pain point "${painPointId}" but pain point does not list this job in leadsToJobIds`,
          });
        }
      }
    }
  }

  if (options.metrics) {
    const driverCategoryIds = driverCategoryIdsFromRegistry(options.metrics);
    for (const focusArea of catalog.focusAreas) {
      for (const driverCategoryId of focusArea.driverCategoryIds) {
        if (!driverCategoryIds.has(driverCategoryId)) {
          issues.push({
            code: 'unknown_driver_category',
            id: driverCategoryId,
            message: `Focus area "${focusArea.id}" references unknown driver category "${driverCategoryId}"`,
          });
        }
      }
    }

    for (const row of options.metrics) {
      if (row.touchpointId && options.touchpointIds && !options.touchpointIds.has(row.touchpointId)) {
        issues.push({
          code: 'unknown_touchpoint',
          id: row.touchpointId,
          message: `KPI "${row.id}" references unknown touchpoint "${row.touchpointId}"`,
        });
      }
    }
  }

  for (const [stageId, heartDimensionId] of Object.entries(
    catalog.links?.heartDimensionByLifecycleStage ?? {},
  )) {
    const parsedStageId = LifecycleStageIdSchema.safeParse(stageId);
    if (!parsedStageId.success || !lifecycleStageIds.has(parsedStageId.data)) {
      issues.push({
        code: 'unknown_level',
        id: stageId,
        message: `Heart dimension mapping references unknown lifecycle stage "${stageId}"`,
      });
      continue;
    }
    if (!HeartDimensionIdSchema.safeParse(heartDimensionId).success) {
      issues.push({
        code: 'unknown_heart_dimension',
        id: heartDimensionId,
        message: `Lifecycle stage "${stageId}" maps to unknown HEART dimension "${heartDimensionId}"`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function intentsForOpportunity(
  catalog: CustomerCatalog,
  opportunityId: VisitOpportunityId,
): string[] {
  const opportunity = catalog.opportunities.find((row) => row.id === opportunityId);
  if (opportunity?.intentIds.length) return opportunity.intentIds;
  return catalog.intents
    .filter((intent) => intent.opportunityId === opportunityId)
    .map((intent) => intent.id);
}

/** Inverse of intent → opportunity edges on the customer catalog. */
export function opportunityIdsForIntents(
  catalog: CustomerCatalog,
  intentIds: readonly string[],
): VisitOpportunityId[] {
  const byIntent = new Map(catalog.intents.map((row) => [row.id, row.opportunityId]));
  const ids = new Set<VisitOpportunityId>();
  for (const intentId of intentIds) {
    const opportunityId = byIntent.get(intentId);
    if (opportunityId) ids.add(opportunityId);
  }
  return [...ids];
}

export function engagementLevelsForIntent(
  catalog: CustomerCatalog,
  intentId: string,
): string[] {
  return catalog.engagementLevels
    .filter((level) => level.validIntentIds.includes(intentId))
    .map((level) => level.id);
}

export function painPointDefinition(
  catalog: CustomerCatalog,
  painPointId: string,
): CustomerCatalog['painPoints'][number] | undefined {
  return catalog.painPoints.find((row) => row.id === painPointId);
}

/** Derives each job's painPointIds from the catalog, which owns the pain point → job edge. */
export function linkJobsToPainPoints(
  jobs: readonly JobDefinition[],
  painPoints: readonly CustomerPainPointDefinition[],
): JobDefinition[] {
  const byJobId = new Map<string, string[]>();
  for (const painPoint of painPoints) {
    for (const jobId of painPoint.leadsToJobIds) {
      const bucket = byJobId.get(jobId) ?? [];
      bucket.push(painPoint.id);
      byJobId.set(jobId, bucket);
    }
  }
  return jobs.map((job) => ({ ...job, painPointIds: byJobId.get(job.id) ?? [] }));
}

export function painPointsForJob(
  catalog: CustomerCatalog,
  job: JobDefinition,
): CustomerCatalog['painPoints'] {
  const ids = new Set(job.painPointIds ?? []);
  for (const painPoint of catalog.painPoints) {
    if (painPoint.leadsToJobIds.includes(job.id)) {
      ids.add(painPoint.id);
    }
  }
  return catalog.painPoints.filter((row) => ids.has(row.id));
}

export function jobsForPainPoint(
  painPointId: string,
  catalog: CustomerCatalog,
  jobs: readonly JobDefinition[],
): JobDefinition[] {
  const painPoint = painPointDefinition(catalog, painPointId);
  const ids = new Set(painPoint?.leadsToJobIds ?? []);
  for (const job of jobs) {
    if ((job.painPointIds ?? []).includes(painPointId)) {
      ids.add(job.id);
    }
  }
  return jobs.filter((job) => ids.has(job.id));
}

export type {
  CustomerCatalog,
  CustomerCatalogOverlay,
  CustomerPainPointDefinition,
  PsychographicSegmentCatalog,
  PsychographicSegmentProfile,
  PsychographicSegmentSummary,
} from '../customer/profile/customer.js';
