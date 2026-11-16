/**
 * Browser-safe Situations surface — no disk I/O.
 * @packageDocumentation
 */

export type { JobSituationModel } from './types/job-situation-model.js';
export {
  JobSituationModelSchema,
  parseJobSituationModel,
} from './schemas/job-situation-model.schema.js';

export type { Job, JobObstacle, StrategyEntityLifecycle } from './types/job.js';
export type { HeartDimension } from './types/heart.js';
export { HEART_DIMENSIONS } from './types/heart.js';
export type { HoneycombFacetId, StrategyHoneycombFacets } from './types/honeycomb.js';
export {
  DEFAULT_NEED_HONEYCOMB_FACETS,
  DEFAULT_JOB_HONEYCOMB_FACETS,
  HONEYCOMB_FACET_IDS,
} from './types/honeycomb.js';

export {
  JobObstacleSchema,
  JobSchema,
  parseJob,
  StrategyEntityLifecycleSchema,
} from './schemas/job.schema.js';
export {
  HoneycombFacetIdSchema,
  StrategyHoneycombFacetsSchema,
} from './schemas/honeycomb.schema.js';

export type { JtbdJobClauses, JtbdJobIssue } from './jtbd/jtbd-job.js';
export {
  assertJtbdJobClauses,
  collectJtbdJobIssues,
  JTBD_CLAUSE_MIN_CHARS,
  normalizeJtbdClause,
} from './jtbd/jtbd-job.js';

export type { JobObstacleClauses, JobObstacleIssue } from './jtbd/jtbd-obstacle.js';
export {
  assertJobObstacle,
  collectJobObstacleIssues,
  JOB_OBSTACLE_TEXT_MIN_CHARS,
  MAX_OBSTACLES_PER_JOB,
} from './jtbd/jtbd-obstacle.js';
export { obstacleCatalogFromJobs } from './catalog/obstacle-catalog-from-jobs.js';
export type { CustomerObstacleDefinition, ObstacleCatalog } from './catalog/obstacles.schema.js';

export { SITUATIONS_PACKAGE } from './contract/situations-package-meta.js';
export { situationsFromJSON, situationsToJSON } from './contract/json.js';
export { pickJobsByIds } from './job/pick-jobs-by-ids.js';
export {
  rankJobsForPersona,
  type PersonaJobRankingSourceV1,
  type RankedJobForPersonaV1,
} from './job/rank-jobs-for-persona.js';
