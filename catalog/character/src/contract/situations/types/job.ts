import type { HeartDimension } from './heart.js';
import type { StrategyHoneycombFacets } from './honeycomb.js';

export type StrategyEntityLifecycle = 'proposed' | 'validated' | 'deprecated';

/** Friction nested on a JTBD — ownership is this job. */
export type JobObstacle = {
  id: string;
  text: string;
  jobIds?: string[];
  removable?: boolean;
  severity?: 'mild' | 'serious' | 'severe' | 'systemic';
  heart?: HeartDimension;
  lifecycle?: StrategyEntityLifecycle;
};

/**
 * JTBD job — the unit of user need (when / want / so).
 * `text` is the short diagram label; clauses carry the full JTBD.
 */
export type Job = {
  id: string;
  text: string;
  shortText?: string;
  when: string;
  want: string;
  so: string;
  obstacles?: JobObstacle[];
  lifecycle?: StrategyEntityLifecycle;
  revisedAt?: string;
  facets?: StrategyHoneycombFacets;
  persona?: string;
  segment?: string;
};
