import type { Job, JobContextModel } from '@local-hosting/twinfile-context';

function uniqueJobs(jobs: readonly Job[]): Job[] {
  const byId = new Map<string, Job>();
  for (const job of jobs) {
    const id = job.id.trim();
    if (!id || byId.has(id)) {
      continue;
    }
    byId.set(id, job);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

/** Union org-mounted Context packs into one lookup surface for brief + plan. */
export function mergeJobContextModels(
  models: readonly JobContextModel[],
): JobContextModel | undefined {
  const rows = models.filter((row) => row?.id?.trim());
  if (rows.length === 0) {
    return undefined;
  }
  if (rows.length === 1) {
    return rows[0];
  }
  const jobs = uniqueJobs(rows.flatMap((row) => row.jobs ?? []));
  const context = rows.map((row) => row.context?.trim()).filter(Boolean).join(' · ');
  return {
    id: 'jcm:merged',
    label: rows.map((row) => row.label?.trim()).filter(Boolean).join(' · ') || 'Merged contexts',
    context: context || 'Multiple job contexts apply to this episode.',
    jobs,
  };
}

/** @deprecated Prefer {@link mergeJobContextModels}. */
export const mergeJobSituationModels = mergeJobContextModels;
