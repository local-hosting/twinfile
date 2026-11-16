import type { Job, JobObstacle } from '../types/job.js';
import type { CustomerObstacleDefinition, ObstacleCatalog } from './obstacles.schema.js';

function obstacleRow(obstacle: JobObstacle, jobId: string): CustomerObstacleDefinition {
  return {
    id: obstacle.id,
    label: obstacle.text,
    jobId,
    removable: obstacle.removable ?? true,
    ...(obstacle.heart ? { heartDimensionId: obstacle.heart } : {}),
  };
}

/** Flattens job-nested obstacles into an {@link ObstacleCatalog}; a shared obstacle id keeps its first job. */
export function obstacleCatalogFromJobs(jobs: readonly Job[]): ObstacleCatalog {
  const byId = new Map<string, CustomerObstacleDefinition>();
  for (const job of jobs) {
    for (const obstacle of job.obstacles ?? []) {
      if (!byId.has(obstacle.id)) byId.set(obstacle.id, obstacleRow(obstacle, job.id));
    }
  }
  return { specVersion: '1.0', obstacles: [...byId.values()] };
}
