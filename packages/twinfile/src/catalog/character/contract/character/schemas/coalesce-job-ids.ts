/** Merge legacy `needIds` into `jobIds` and drop `needIds` from the object. */
export function coalesceJobIdsFields<T extends Record<string, unknown>>(
  row: T,
): Omit<T, 'needIds'> & { jobIds?: string[] } {
  const fromJobs = Array.isArray(row.jobIds) ? (row.jobIds as unknown[]) : [];
  const fromNeeds = Array.isArray(row.needIds) ? (row.needIds as unknown[]) : [];
  const jobIds = [
    ...new Set(
      [...fromJobs, ...fromNeeds].filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      ),
    ),
  ];
  const { needIds: _legacy, ...rest } = row;
  return jobIds.length > 0 ? { ...rest, jobIds } : { ...rest };
}
