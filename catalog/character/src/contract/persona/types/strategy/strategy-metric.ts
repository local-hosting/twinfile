import type { HeartDimension } from '../story/heart.js';

/** Measurable KPI. HEART metrics follow Goals → Signals → Metrics. */
export type StrategyMetric = {
  id: string;
  name: string;
  unit?: string;
  direction: 'up' | 'down';
  source?: string;
  /** HEART dimension this metric measures. */
  heart?: HeartDimension;
  /** HEART goal, e.g. "Customers leave the store with service working". */
  goal?: string;
  /** Observable behavior or attitude that indicates progress toward the goal. */
  signal?: string;
};
