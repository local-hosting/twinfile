import { normalizeJtbdClause } from './jtbd-job.js';

/** Minimum meaningful obstacle text length (after normalize). */
export const JOB_OBSTACLE_TEXT_MIN_CHARS = 12;

/** Soft density guard — catch-all dumps are not JTBD obstacles. */
export const MAX_OBSTACLES_PER_JOB = 8;

/** Desire / job language — belongs on the job, not as an obstacle. */
const DESIRE_OR_JOB_PREFIX =
  /^(i\s+want(?:\s+to)?|i\s+need\s+to|i'?d\s+like(?:\s+to)?|i\s+would\s+like(?:\s+to)?|i\s+like\s+to|check\s+in\s+and|get\s+help\s+with|manage\s+my)\b/i;

/** Affect / attitude — not a removable friction. */
const AFFECT_PREFIX =
  /^(afraid|furious|stressed|excited|proud|eager|disappointed|disgusted|impressed|i\s+don'?t\s+have\s+the\s+patience|customers\s+afraid|customers\s+unsure)\b/i;

export type JobObstacleClauses = {
  id: string;
  text: string;
};

export type JobObstacleIssue = {
  path: 'id' | 'text';
  message: string;
};

/**
 * Contractual job-obstacle shape:
 * - `id` starts with `obstacle:`
 * - `text` is friction (blocker), not a desire/job or pure affect
 */
export function collectJobObstacleIssues(obstacle: JobObstacleClauses): JobObstacleIssue[] {
  const id = obstacle.id.trim();
  const text = normalizeJtbdClause(obstacle.text);
  const issues: JobObstacleIssue[] = [];

  if (!id.startsWith('obstacle:')) {
    issues.push({
      path: 'id',
      message: 'obstacle id must start with "obstacle:"',
    });
  } else if (id.length <= 'obstacle:'.length) {
    issues.push({
      path: 'id',
      message: 'obstacle id must include a slug after "obstacle:"',
    });
  }

  if (text.length < JOB_OBSTACLE_TEXT_MIN_CHARS) {
    issues.push({
      path: 'text',
      message: `obstacle text must be at least ${JOB_OBSTACLE_TEXT_MIN_CHARS} characters (got ${text.length})`,
    });
  }

  if (DESIRE_OR_JOB_PREFIX.test(text)) {
    issues.push({
      path: 'text',
      message:
        'obstacle text must describe friction, not a desire or job — avoid starting with "I want" / "I need to" / job imperatives',
    });
  }

  if (AFFECT_PREFIX.test(text)) {
    issues.push({
      path: 'text',
      message:
        'obstacle text must describe removable friction, not affect ("Afraid…", "Furious…", …)',
    });
  }

  return issues;
}

export function assertJobObstacle(obstacle: JobObstacleClauses): void {
  const issues = collectJobObstacleIssues(obstacle);
  if (issues.length === 0) {
    return;
  }
  throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
}
