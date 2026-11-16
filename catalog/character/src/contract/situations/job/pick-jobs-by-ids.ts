import type { Job } from '../types/job.js';
import type { JobSituationModel } from '../types/job-situation-model.js';

/** Resolve JTBD jobs referenced by Story scene or activity `jobIds`. */
export function pickJobsByIds(
  model: JobSituationModel,
  jobIds: readonly string[],
): Job[] {
  const wanted = new Set(jobIds.map((id) => id.trim()).filter(Boolean));
  if (wanted.size === 0) return [];
  return model.jobs.filter((job) => wanted.has(job.id));
}
