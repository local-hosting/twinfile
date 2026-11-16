import type { CustomerCatalog } from '@local-hosting/twinfile-character/pcm/people/customer/profile/customer.js';
import type { JobDefinition } from './jtbd.schema.js';
import {
  JtbdRelationshipGraphSchema,
  type JtbdRelationshipEdge,
} from '@local-hosting/twinfile-character/pcm/people/customer/graph/customer-relationships.js';
import {
  CustomerObstacleDefinitionSchema,
  ObstacleCatalogSchema,
  type CustomerObstacleDefinition,
  type ObstacleCatalog,
} from './obstacles.schema.js';

export interface ObstacleValidationIssue {
  code:
    | 'unknown_job'
    | 'unknown_obstacle'
    | 'obstacle_job_mismatch'
    | 'duplicate_obstacle_id';
  message: string;
  obstacleId?: string;
  jobId?: string;
}

export function parseObstacleDefinition(input: unknown): CustomerObstacleDefinition {
  return CustomerObstacleDefinitionSchema.parse(input);
}

export function parseObstacleCatalog(input: unknown): ObstacleCatalog {
  return ObstacleCatalogSchema.parse(input);
}

export function obstacleIdForLabel(jobId: string, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${jobId}--${slug}`;
}

/** Derives each job's obstacleIds from the catalog, which owns the obstacle → job edge. */
export function linkJobsToObstacles(
  jobs: readonly JobDefinition[],
  obstacles: readonly CustomerObstacleDefinition[],
): JobDefinition[] {
  const byJobId = new Map<string, string[]>();
  for (const obstacle of obstacles) {
    const bucket = byJobId.get(obstacle.jobId) ?? [];
    bucket.push(obstacle.id);
    byJobId.set(obstacle.jobId, bucket);
  }
  return jobs.map((job) => ({ ...job, obstacleIds: byJobId.get(job.id) ?? [] }));
}

export function obstaclesForJob(
  catalog: ObstacleCatalog,
  jobId: string,
): CustomerObstacleDefinition[] {
  return catalog.obstacles.filter((row) => row.jobId === jobId);
}

export function validateObstacleCatalog(
  catalog: ObstacleCatalog,
  jobs: readonly JobDefinition[],
): { valid: boolean; issues: ObstacleValidationIssue[] } {
  const jobIds = new Set(jobs.map((row) => row.id));
  const obstacleIds = new Set<string>();
  const issues: ObstacleValidationIssue[] = [];

  for (const obstacle of catalog.obstacles) {
    if (obstacleIds.has(obstacle.id)) {
      issues.push({
        code: 'duplicate_obstacle_id',
        obstacleId: obstacle.id,
        message: `Duplicate obstacle id "${obstacle.id}"`,
      });
    }
    obstacleIds.add(obstacle.id);

    if (!jobIds.has(obstacle.jobId)) {
      issues.push({
        code: 'unknown_job',
        obstacleId: obstacle.id,
        jobId: obstacle.jobId,
        message: `Obstacle "${obstacle.id}" references unknown job "${obstacle.jobId}"`,
      });
      continue;
    }
  }

  for (const job of jobs) {
    for (const obstacleId of job.obstacleIds ?? []) {
      const obstacle = catalog.obstacles.find((row) => row.id === obstacleId);
      if (!obstacle) {
        issues.push({
          code: 'unknown_obstacle',
          obstacleId,
          jobId: job.id,
          message: `Job "${job.id}" references unknown obstacle "${obstacleId}"`,
        });
        continue;
      }
      if (obstacle.jobId !== job.id) {
        issues.push({
          code: 'obstacle_job_mismatch',
          obstacleId,
          jobId: job.id,
          message: `Job "${job.id}" lists obstacle "${obstacleId}" but obstacle targets job "${obstacle.jobId}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}


export function buildJtbdRelationshipGraph(
  customerCatalog: CustomerCatalog,
  jobs: readonly JobDefinition[],
  obstacleCatalog: ObstacleCatalog,
  kpiLinks: Readonly<Record<string, readonly string[]>> = {},
): ReturnType<typeof JtbdRelationshipGraphSchema.parse> {
  const edges: JtbdRelationshipEdge[] = [];

  for (const painPoint of customerCatalog.painPoints) {
    for (const jobId of painPoint.leadsToJobIds) {
      edges.push({
        kind: 'pain_point_leads_to_job',
        painPointId: painPoint.id,
        jobId,
      });
    }
  }

  const jobIds = new Set(jobs.map((job) => job.id));
  for (const obstacle of obstacleCatalog.obstacles) {
    if (!jobIds.has(obstacle.jobId)) continue;
    edges.push({
      kind: 'obstacle_blocks_job',
      obstacleId: obstacle.id,
      jobId: obstacle.jobId,
    });
  }

  for (const [jobId, metricIds] of Object.entries(kpiLinks)) {
    if (!jobIds.has(jobId)) continue;
    for (const metricId of metricIds) {
      edges.push({
        kind: 'job_measures_metric',
        jobId,
        metricId,
      });
    }
  }

  return JtbdRelationshipGraphSchema.parse({ edges });
}
