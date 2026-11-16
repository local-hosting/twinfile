import {
  JobDefinitionSchema,
  JtbdCatalogSchema,
  JtbdKpiMapSchema,
  type JobDefinition,
  type JtbdCatalog,
  type JtbdKpiMap,
} from './jtbd.schema.js';

export type {
  JobAudienceScope,
  JobDefinition,
  JobDeliveryStatus,
  JobGranularity,
  JtbdCatalog,
  JtbdKpiMap,
} from './jtbd.schema.js';
import type { KpiDefinition } from '../types/kpi-definition-wire.js';

/**
 * Canonical:
 * When [Context/Circumstance], I want to [Goal/Job], so I can [Outcome/Need]
 * without [Pain Point/Obstacle].
 */
const JOB_STATEMENT_PATTERNS: readonly RegExp[] = [
  /^When (.+?), I want to (.+?) so I can (.+?) without (.+?)\.?$/i,
  /^When (.+?), I want to (.+?) so that (.+?) without (.+?)\.?$/i,
  /^When (.+?), I want (.+?) so I can (.+?) without (.+?)\.?$/i,
  /^When (.+?), I want to (.+?) so I can (.+?)\.?$/i,
  /^When (.+?), I want to (.+?) so that (.+?)\.?$/i,
  /^When (.+?), I want (.+?) so that (.+?)\.?$/i,
  /^When (.+?), I want (.+?) so I can (.+?)\.?$/i,
];

/** Parsed JTBD statement: context → goal → outcome (+ optional without / obstacle). */
export interface ParsedJobStatement {
  context: string;
  goal: string;
  outcome: string;
  /** Pain point / obstacle from an optional "without …" clause. */
  without?: string;
  jobStatement: string;
}

export interface LegacyJtbdRecord {
  id?: string;
  slug: string;
  title: string;
  job: string;
  stage?: string;
  segments?: string;
  product?: string;
}

export interface JtbdValidationIssue {
  code:
    | 'unknown_job'
    | 'unknown_metric'
    | 'unknown_parent_job'
    | 'parent_job_must_be_theme'
    | 'story_job_requires_parent'
    | 'missing_segment_ids'
    | 'audience_scope_mismatch'
    | 'unknown_segment'
    | 'unknown_touchpoint';
  message: string;
  jobId?: string;
  metricId?: string;
  parentJobId?: string;
  segmentId?: string;
  touchpointId?: string;
}

export function isThemeJob(job: JobDefinition): boolean {
  return (job.granularity ?? 'theme') === 'theme';
}

export function isStoryJob(job: JobDefinition): boolean {
  return job.granularity === 'story';
}

export function themeJobs(catalog: JtbdCatalog): JobDefinition[] {
  return catalog.jobs.filter(isThemeJob);
}

export function storyJobs(catalog: JtbdCatalog): JobDefinition[] {
  return catalog.jobs.filter(isStoryJob);
}

export function childJobs(catalog: JtbdCatalog, parentJobId: string): JobDefinition[] {
  return catalog.jobs.filter((job) => job.parentJobId === parentJobId);
}

function isUniversalJob(
  job: JobDefinition,
  universalSegmentId?: string,
): boolean {
  if (job.audienceScope === 'universal') return true;
  if (job.audienceScope === 'segmented') return false;
  const segmentIds = job.segmentIds ?? [];
  if (segmentIds.length === 0) return true;
  if (universalSegmentId && segmentIds.length === 1 && segmentIds[0] === universalSegmentId) {
    return true;
  }
  return false;
}

export function jobsForSegment(
  catalog: JtbdCatalog,
  segmentId: string,
  options: { universalSegmentId?: string } = {},
): JobDefinition[] {
  const universalId = options.universalSegmentId ?? catalog.universalSegmentId;

  return catalog.jobs.filter((job) => {
    if (isUniversalJob(job, universalId)) return true;
    return (job.segmentIds ?? []).includes(segmentId);
  });
}

export function parseJobDefinition(input: unknown): JobDefinition {
  return JobDefinitionSchema.parse(input);
}

export function parseJtbdCatalog(input: unknown): JtbdCatalog {
  return JtbdCatalogSchema.parse(input);
}

export function parseJtbdKpiMap(input: unknown): JtbdKpiMap {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    if ('links' in record) {
      return JtbdKpiMapSchema.parse(input);
    }

    const links: Record<string, string[]> = {};
    for (const [jobId, metricIds] of Object.entries(record)) {
      links[jobId] = parseMetricIdList(metricIds, jobId);
    }
    return JtbdKpiMapSchema.parse({ links });
  }

  return JtbdKpiMapSchema.parse(input);
}

function parseMetricIdList(value: unknown, jobId: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`Invalid metric id list for job "${jobId}"`);
  }
  return value;
}

export function parseJobStatement(statement: string): ParsedJobStatement {
  const trimmed = statement.trim();
  for (const pattern of JOB_STATEMENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (!match) continue;

    const [, context, goal, outcome, without] = match;
    return {
      context: context!.trim(),
      goal: goal!.trim(),
      outcome: outcome!.trim(),
      ...(without?.trim() ? { without: without.trim() } : {}),
      jobStatement: trimmed,
    };
  }

  throw new Error(
    'Job statement must match: When [Context], I want to [Goal], so I can [Outcome] (without [Obstacle])',
  );
}

export function importLegacyJtbdRecord(record: LegacyJtbdRecord): JobDefinition {
  const parsed = parseJobStatement(record.job);
  const segmentIds = record.segments
    ? record.segments.split(',').map((segment) => segment.trim()).filter(Boolean)
    : undefined;

  return JobDefinitionSchema.parse({
    id: record.slug,
    label: record.title,
    context: parsed.context,
    goal: parsed.goal,
    outcome: parsed.outcome,
    jobStatement: parsed.jobStatement,
    stage: record.stage,
    segmentIds,
    productContext: record.product?.trim() ? record.product : undefined,
  });
}

export function importLegacyJtbdCatalog(
  records: readonly LegacyJtbdRecord[],
  options: { methodId?: string } = {},
): JtbdCatalog {
  return JtbdCatalogSchema.parse({
    methodId: options.methodId,
    jobs: records.map((record) => importLegacyJtbdRecord(record)),
  });
}

export function validateJtbdKpiMap(
  map: JtbdKpiMap,
  registry: readonly KpiDefinition[],
  catalog?: JtbdCatalog,
): { valid: boolean; issues: JtbdValidationIssue[] } {
  const registryIds = new Set(registry.map((row) => row.id));
  const jobIds = catalog ? new Set(catalog.jobs.map((job) => job.id)) : undefined;
  const issues: JtbdValidationIssue[] = [];

  for (const [jobId, metricIds] of Object.entries(map.links)) {
    if (jobIds && !jobIds.has(jobId)) {
      issues.push({
        code: 'unknown_job',
        jobId,
        message: `Job "${jobId}" is not in the JTBD catalog`,
      });
    }

    for (const metricId of metricIds) {
      if (!registryIds.has(metricId)) {
        issues.push({
          code: 'unknown_metric',
          jobId,
          metricId,
          message: `Metric "${metricId}" linked from job "${jobId}" is not in the KPI registry`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export function kpiMapFromCatalog(catalog: JtbdCatalog): JtbdKpiMap {
  return JtbdKpiMapSchema.parse({
    specVersion: '1.0',
    methodId: catalog.methodId,
    links: catalog.kpiLinks ?? {},
  });
}

export function validateJtbdCatalog(
  catalog: JtbdCatalog,
  options: {
    segmentIds?: ReadonlySet<string>;
    touchpointIds?: ReadonlySet<string>;
  } = {},
): { valid: boolean; issues: JtbdValidationIssue[] } {
  const issues: JtbdValidationIssue[] = [];

  for (const job of catalog.jobs) {
    if (job.parentJobId) {
      const parent = catalog.jobs.find((row) => row.id === job.parentJobId);
      if (!parent) {
        issues.push({
          code: 'unknown_parent_job',
          jobId: job.id,
          parentJobId: job.parentJobId,
          message: `Job "${job.id}" references unknown parent job "${job.parentJobId}"`,
        });
      } else if (!isThemeJob(parent)) {
        issues.push({
          code: 'parent_job_must_be_theme',
          jobId: job.id,
          parentJobId: job.parentJobId,
          message: `Parent job "${job.parentJobId}" for "${job.id}" must have granularity "theme"`,
        });
      }
    }

    if (isStoryJob(job) && !job.parentJobId) {
      issues.push({
        code: 'story_job_requires_parent',
        jobId: job.id,
        message: `Story job "${job.id}" must declare parentJobId`,
      });
    }

    if (job.audienceScope === 'segmented' && (job.segmentIds ?? []).length === 0) {
      issues.push({
        code: 'missing_segment_ids',
        jobId: job.id,
        message: `Segmented job "${job.id}" must declare segmentIds`,
      });
    }

    if (
      job.audienceScope === 'universal' &&
      (job.segmentIds ?? []).length > 0 &&
      !(catalog.universalSegmentId && job.segmentIds?.length === 1 &&
        job.segmentIds[0] === catalog.universalSegmentId)
    ) {
      issues.push({
        code: 'audience_scope_mismatch',
        jobId: job.id,
        message: `Universal job "${job.id}" should not declare segmentIds`,
      });
    }

    if (options.segmentIds) {
      for (const segmentId of job.segmentIds ?? []) {
        if (!options.segmentIds.has(segmentId)) {
          issues.push({
            code: 'unknown_segment',
            jobId: job.id,
            segmentId,
            message: `Job "${job.id}" references unknown segment "${segmentId}"`,
          });
        }
      }
    }

    if (options.touchpointIds) {
      for (const touchpointId of job.touchpointIds ?? []) {
        if (!options.touchpointIds.has(touchpointId)) {
          issues.push({
            code: 'unknown_touchpoint',
            jobId: job.id,
            touchpointId,
            message: `Job "${job.id}" references unknown touchpoint "${touchpointId}"`,
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
