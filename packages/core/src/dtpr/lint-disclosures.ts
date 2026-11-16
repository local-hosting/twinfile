export type DtprLintCode = 'W_DTPR_MISSING' | 'W_DTPR_ACCOUNTABLE_REF';

export type DtprLintIssue = {
  code: DtprLintCode;
  message: string;
  file?: string;
};

type IdRow = { id: string; dtpr?: unknown; accountable?: string; roles?: string[] };

export function lintDtprDisclosures(
  mergedPlace: Record<string, unknown>,
  options: { published?: boolean; roleIds?: Set<string> } = {},
): DtprLintIssue[] {
  const issues: DtprLintIssue[] = [];
  const roleIds = options.roleIds ?? new Set<string>();

  for (const key of ['sensors', 'ai'] as const) {
    const rows = mergedPlace[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows as IdRow[]) {
      if (options.published && !row.dtpr) {
        issues.push({
          code: 'W_DTPR_MISSING',
          message: `${key}/${row.id} has no DTPR disclosure`,
        });
      }
      if (row.accountable && roleIds.size > 0 && !roleIds.has(row.accountable)) {
        issues.push({
          code: 'W_DTPR_ACCOUNTABLE_REF',
          message: `${key}/${row.id} accountable ${row.accountable} is not a defined role`,
        });
      }
    }
  }
  return issues;
}
