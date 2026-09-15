/**
 * @local-hosting/twinfile-context — Job Context Model (mountable JTBD packs).
 *
 * JTBD: When [Context/Circumstance], I want to [Goal/Job], so I can [Outcome/Need]
 * without [Pain Point/Obstacle].
 *
 * @packageDocumentation
 */

export type { JobContextModel, JobSituationModel } from './types/job-context-model.js';
export {
  JobContextModelSchema,
  JobSituationModelSchema,
  parseJobContextModel,
  parseJobSituationModel,
} from './schemas/job-context-model.schema.js';

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
  formatJtbdStatement,
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

export {
  kpiMapFromCatalog,
  parseJtbdCatalog,
  validateJtbdCatalog,
} from './catalog/jtbd.js';
export type { JtbdCatalog, JtbdKpiMap, JobDefinition } from './catalog/jtbd.schema.js';
export {
  parseObstacleCatalog,
  validateObstacleCatalog,
} from './catalog/obstacles.js';
export { obstacleCatalogFromJobs } from './catalog/obstacle-catalog-from-jobs.js';
export type { CustomerObstacleDefinition, ObstacleCatalog } from './catalog/obstacles.schema.js';

export {
  contextFromJSON,
  contextToJSON,
  situationsFromJSON,
  situationsToJSON,
} from './contract/json.js';
export { pickJobsByIds } from './job/pick-jobs-by-ids.js';
export {
  contextFromCharacter,
  type CharacterJobsSourceV1,
} from './job/context-from-character.js';
export {
  rankJobsForPersona,
  type PersonaJobRankingSourceV1,
  type RankedJobForPersonaV1,
} from './job/rank-jobs-for-persona.js';

export {
  CONTEXT_PACKAGE,
  SITUATIONS_PACKAGE,
} from './contract/context-package-meta.js';
export {
  HeartDimensionIdSchema,
  type HeartDimensionId,
} from './schemas/heart-dimension-id.schema.js';
