/**
 * Google HEART metrics framework dimensions. Each is measured by `StrategyMetric`s
 * tagged with `heart` (Goals → Signals → Metrics).
 */
export const HEART_DIMENSIONS = [
  'happiness',
  'engagement',
  'adoption',
  'retention',
  'task-success',
] as const;

export type HeartDimension = (typeof HEART_DIMENSIONS)[number];

/** Signed change to one HEART dimension, in −1…1. */
export type HeartImpact = {
  dimension: HeartDimension;
  delta: number;
  /** StrategyMetric (tagged with this dimension) the impact shows up in. */
  metricId?: string;
};

/** HEART values (0…1) after one journey phase. */
export type JourneyHeartPoint = {
  phaseId: string;
  values: Record<HeartDimension, number>;
};

/** Start → end of one HEART dimension across a journey. */
export type JourneyHeartTrend = {
  dimension: HeartDimension;
  start: number;
  end: number;
  /** End ≥ start, or end ≥ the "maintained high" floor. */
  healthy: boolean;
};
