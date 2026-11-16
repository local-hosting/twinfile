import type { Job } from './job.js';

/**
 * Job Situation Model (Situations) — one mountable pack of JTBD jobs (+ nested obstacles)
 * for a situation. Not every persona/story hits every situation; mount selectively.
 */
export type JobSituationModel = {
  id: string;
  label: string;
  /** Canonical situation this pack covers (aligns with JTBD `when` themes). */
  situation: string;
  revision?: number;
  jobs: Job[];
};
