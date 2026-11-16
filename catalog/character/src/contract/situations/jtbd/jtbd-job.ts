/** Minimum meaningful JTBD clause length (after trim / whitespace collapse). */
export const JTBD_CLAUSE_MIN_CHARS = 8;

/** Desire language that belongs in `want`, not situational `when` / outcome `so`. */
const DESIRE_PREFIX =
  /^(i\s+want(?:\s+to)?|i\s+need\s+to|i'?d\s+like(?:\s+to)?|i\s+would\s+like(?:\s+to)?)\b/i;

const WANT_DESIRE_PREFIX = /^(i\s+want(?:\s+to)?|i\s+need\s+to)\b/i;

export type JtbdJobClauses = {
  when: string;
  want: string;
  so: string;
};

export function normalizeJtbdClause(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export type JtbdJobIssue = {
  path: 'when' | 'want' | 'so';
  message: string;
};

/**
 * Contractual JTBD shape for user-need jobs:
 * - `when` = situation (not desire)
 * - `want` = job / progress sought
 * - `so` = expected outcome
 */
export function collectJtbdJobIssues(job: JtbdJobClauses): JtbdJobIssue[] {
  const when = normalizeJtbdClause(job.when);
  const want = normalizeJtbdClause(job.want);
  const so = normalizeJtbdClause(job.so);
  const issues: JtbdJobIssue[] = [];

  for (const [path, value] of [
    ['when', when],
    ['want', want],
    ['so', so],
  ] as const) {
    if (value.length < JTBD_CLAUSE_MIN_CHARS) {
      issues.push({
        path,
        message: `JTBD ${path} must be at least ${JTBD_CLAUSE_MIN_CHARS} characters (got ${value.length})`,
      });
    }
  }

  if (DESIRE_PREFIX.test(when)) {
    issues.push({
      path: 'when',
      message:
        'JTBD when must describe the situation, not a desire — avoid starting with "I want" / "I need to" (put the job in want)',
    });
  }

  if (WANT_DESIRE_PREFIX.test(want)) {
    issues.push({
      path: 'want',
      message:
        'JTBD want should state the job (e.g. "to …" or a verb phrase), not "I want …" / "I need to …"',
    });
  }

  if (DESIRE_PREFIX.test(so)) {
    issues.push({
      path: 'so',
      message: 'JTBD so must describe the outcome, not a desire prefix like "I want"',
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
