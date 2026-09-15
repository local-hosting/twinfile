import type { Job } from '../types/job.js';
import type { JobContextModel } from '../types/job-context-model.js';

export type CharacterJobsSourceV1 = {
  id: string;
  persona?: { id?: string; label?: string };
  jobs?: readonly Job[];
};

/** Build a mountable context twin from legacy Character job lists (no locker I/O). */
export function contextFromCharacter(source: CharacterJobsSourceV1): JobContextModel | undefined {
  const jobs = source.jobs?.filter((job) => job?.id?.trim()) ?? [];
  if (jobs.length === 0) return undefined;

  const personaId = source.persona?.id?.trim() || source.id.trim();
  const label = source.persona?.label?.trim() || personaId || source.id.trim();

  return {
    id: `context:${personaId}`,
    label,
    context: label,
    jobs: [...jobs],
  };
}