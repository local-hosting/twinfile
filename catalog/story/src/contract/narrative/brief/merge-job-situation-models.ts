import type { Job } from '@local-hosting/twinfile-character/jsm';
import type { JobSituationModel } from '@local-hosting/twinfile-character/jsm';

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

/** Union org-mounted JSM packs into one lookup surface for brief + plan. */
export function mergeJobSituationModels(
  models: readonly JobSituationModel[],
): JobSituationModel | undefined {
  const rows = models.filter((row) => row?.id?.trim());
  if (rows.length === 0) {
    return undefined;
  }
  if (rows.length === 1) {
    return rows[0];
  }
  const jobs = uniqueJobs(rows.flatMap((row) => row.jobs ?? []));
  const situation = rows.map((row) => row.situation?.trim()).filter(Boolean).join(' · ');
  return {
    id: 'jsm:merged',
    label: rows.map((row) => row.label?.trim()).filter(Boolean).join(' · ') || 'Merged situations',
    situation: situation || 'Multiple job situations apply to this episode.',
    jobs,
  };
}
