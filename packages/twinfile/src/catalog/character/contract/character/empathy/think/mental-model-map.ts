import type { JtbdCatalog, JobDefinition } from '@local-hosting/twinfile/context/catalog/jtbd.schema.js';
import type { TouchpointGraphSpec } from '../../journey/touchpoints.schema.js';
import type { PersonaProfile } from '../../people/audience/persona.schema.js';
import type {
  MentalModelMapCatalog,
  NeedBucket,
  NeedSatisfaction,
} from './mental-model-map.schema.js';
import { MentalModelMapCatalogSchema } from './mental-model-map.schema.js';
import { isStoryJob, jobsForSegment } from '@local-hosting/twinfile/context/catalog/jtbd.js';

export interface MentalModelMapIssue {
  code:
    | 'unknown_job'
    | 'unknown_touchpoint'
    | 'unknown_goal_event'
    | 'story_job_required'
    | 'parent_job_required';
  message: string;
  jobId?: string;
  touchpointId?: string;
  goalEventId?: string;
}

export interface MentalModelMapReport {
  valid: boolean;
  issues: MentalModelMapIssue[];
}

export function parseMentalModelMapCatalog(input: unknown): MentalModelMapCatalog {
  return MentalModelMapCatalogSchema.parse(input);
}

function jobById(catalog: JtbdCatalog, jobId: string): JobDefinition | undefined {
  return catalog.jobs.find((job) => job.id === jobId);
}

/** Derive need buckets from unique visitation goal pairs on story jobs. */
export function deriveNeedBuckets(catalog: JtbdCatalog): NeedBucket[] {
  const seen = new Set<string>();
  const buckets: NeedBucket[] = [];

  for (const job of catalog.jobs) {
    if (!isStoryJob(job) || !job.visitationGoal || !job.visitationSubGoal) continue;
    const key = `${job.visitationGoal}:${job.visitationSubGoal}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buckets.push({
      visitationGoal: job.visitationGoal,
      visitationSubGoal: job.visitationSubGoal,
      label: job.label,
    });
  }

  return buckets;
}

export function needBucketsFromMap(
  map: MentalModelMapCatalog,
  catalog?: JtbdCatalog,
): NeedBucket[] {
  if (map.buckets?.length) return map.buckets;
  if (catalog) return deriveNeedBuckets(catalog);
  return [];
}

export function satisfactionsForJob(
  map: MentalModelMapCatalog,
  jobId: string,
): NeedSatisfaction[] {
  return map.satisfactions.filter((row) => row.jobId === jobId);
}

export function satisfactionsForTouchpoint(
  map: MentalModelMapCatalog,
  touchpointId: string,
): NeedSatisfaction[] {
  return map.satisfactions.filter((row) => row.touchpointId === touchpointId);
}

export function jobsForPersona(
  catalog: JtbdCatalog,
  persona: PersonaProfile,
  options: { universalSegmentId?: string } = {},
): JobDefinition[] {
  const jobs = new Map<string, JobDefinition>();

  for (const affinity of persona.segmentAffinities) {
    for (const job of jobsForSegment(catalog, affinity.segmentId, options)) {
      jobs.set(job.id, job);
    }
  }

  for (const jobId of persona.priorityJobIds ?? []) {
    const job = jobById(catalog, jobId);
    if (job) jobs.set(job.id, job);
  }

  return [...jobs.values()];
}

export function validateMentalModelMap(
  map: MentalModelMapCatalog,
  options: {
    jtbdCatalog?: JtbdCatalog;
    touchpointGraph?: TouchpointGraphSpec;
    goalEventIds?: ReadonlySet<string>;
  } = {},
): MentalModelMapReport {
  const issues: MentalModelMapIssue[] = [];
  const touchpointIds = options.touchpointGraph
    ? new Set(options.touchpointGraph.touchpoints.map((row) => row.id))
    : undefined;

  for (const satisfaction of map.satisfactions) {
    if (options.jtbdCatalog) {
      const job = jobById(options.jtbdCatalog, satisfaction.jobId);
      if (!job) {
        issues.push({
          code: 'unknown_job',
          jobId: satisfaction.jobId,
          message: `Mental model map references unknown job "${satisfaction.jobId}"`,
        });
        continue;
      }

      if (!isStoryJob(job)) {
        issues.push({
          code: 'story_job_required',
          jobId: satisfaction.jobId,
          message: `Mental model map job "${satisfaction.jobId}" must be granularity "story"`,
        });
      }
    }

    if (touchpointIds && !touchpointIds.has(satisfaction.touchpointId)) {
      issues.push({
        code: 'unknown_touchpoint',
        jobId: satisfaction.jobId,
        touchpointId: satisfaction.touchpointId,
        message: `Mental model map references unknown touchpoint "${satisfaction.touchpointId}"`,
      });
    }

    for (const goalEventId of satisfaction.goalEventIds ?? []) {
      if (options.goalEventIds && !options.goalEventIds.has(goalEventId)) {
        issues.push({
          code: 'unknown_goal_event',
          jobId: satisfaction.jobId,
          goalEventId,
          message: `Mental model map references unknown goal event "${goalEventId}" for job "${satisfaction.jobId}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
