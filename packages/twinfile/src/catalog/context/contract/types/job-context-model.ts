import type { Job } from './job.js';

/**
 * Job Context Model — one mountable pack of JTBD jobs (+ nested obstacles)
 * for a **context** (formerly situation). Not every persona/story hits every
 * context; mount selectively and bless via story.
 *
 * JTBD hierarchy on each job:
 * - **context** — situation
 * - **goal** — job / progress
 * - **outcome** — definition of success
 */
export type JobContextModel = {
  id: string;
  label: string;
  /** Canonical context this pack covers (aligns with JTBD `context` / situation themes). */
  context: string;
  revision?: number;
  jobs: Job[];
};

/** @deprecated Prefer {@link JobContextModel}. */
export type JobSituationModel = JobContextModel;
