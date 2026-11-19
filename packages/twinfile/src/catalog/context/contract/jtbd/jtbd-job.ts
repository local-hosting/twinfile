/** Minimum meaningful JTBD clause length (after trim / whitespace collapse). */
export const JTBD_CLAUSE_MIN_CHARS = 8;

/** Desire language that belongs in `goal`, not situational `context` / success `outcome`. */
const DESIRE_PREFIX =
  /^(i\s+want(?:\s+to)?|i\s+need\s+to|i'?d\s+like(?:\s+to)?|i\s+would\s+like(?:\s+to)?)\b/i;

const GOAL_DESIRE_PREFIX = /^(i\s+want(?:\s+to)?|i\s+need\s+to)\b/i;

/**
 * JTBD clause triad (obstacle is nested separately):
 * - **context** — Context / Circumstance
 * - **goal** — Goal / Job
 * - **outcome** — Outcome / Need
 *
 * Full statement:
 * When [Context/Circumstance], I want to [Goal/Job], so I can [Outcome/Need]
 * without [Pain Point/Obstacle].
 */
export type JtbdJobClauses = {
  context: string;
  goal: string;
  outcome: string;
};

export function normalizeJtbdClause(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export type JtbdJobIssue = {
  path: 'context' | 'goal' | 'outcome';
  message: string;
};

/**
 * Contractual JTBD shape for user-need jobs:
 * - `context` = Context / Circumstance (not desire)
 * - `goal` = Goal / Job
 * - `outcome` = Outcome / Need (definition of success)
 */
export function collectJtbdJobIssues(job: JtbdJobClauses): JtbdJobIssue[] {
  const context = normalizeJtbdClause(job.context);
  const goal = normalizeJtbdClause(job.goal);
  const outcome = normalizeJtbdClause(job.outcome);
  const issues: JtbdJobIssue[] = [];

  for (const [path, value] of [
    ['context', context],
    ['goal', goal],
    ['outcome', outcome],
  ] as const) {
    if (value.length < JTBD_CLAUSE_MIN_CHARS) {
      issues.push({
        path,
        message: `JTBD ${path} must be at least ${JTBD_CLAUSE_MIN_CHARS} characters (got ${value.length})`,
      });
    }
  }

  if (DESIRE_PREFIX.test(context)) {
    issues.push({
      path: 'context',
      message:
        'JTBD context must describe the circumstance, not a desire — avoid starting with "I want" / "I need to" (put the job in goal)',
    });
  }

  if (GOAL_DESIRE_PREFIX.test(goal)) {
    issues.push({
      path: 'goal',
      message:
        'JTBD goal should state the job (e.g. "to …" or a verb phrase), not "I want …" / "I need to …"',
    });
  }

  if (DESIRE_PREFIX.test(outcome)) {
    issues.push({
      path: 'outcome',
      message: 'JTBD outcome must describe the need / definition of success, not a desire prefix like "I want"',
    });
  }

  return issues;
}

export function assertJtbdJobClauses(job: JtbdJobClauses): void {
  const issues = collectJtbdJobIssues(job);
  if (issues.length === 0) {
    return;
  }
  throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
}

/** Format the canonical JTBD sentence (optional without clause). */
export function formatJtbdStatement(input: {
  context: string;
  goal: string;
  outcome: string;
  without?: string;
}): string {
  const context = normalizeJtbdClause(input.context);
  const goal = normalizeJtbdClause(input.goal).replace(/^(to\s+)/i, '');
  const outcome = normalizeJtbdClause(input.outcome);
  const without = input.without?.trim() ? normalizeJtbdClause(input.without) : undefined;
  const base = `When ${context}, I want to ${goal}, so I can ${outcome}`;
  return without ? `${base} without ${without}.` : `${base}.`;
}
