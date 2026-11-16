import type { MethodObservation } from '@doppler-group/frameworks-core/measurement';

export type MetricsEvalMessage = string;

export type MetricsEvalResult = {
  pass: boolean;
  messages: MetricsEvalMessage[];
  leafValues?: Record<string, number>;
  observation?: MethodObservation;
};

export type CompareScenarioMetricsOptions = {
  /** Absolute tolerance per key, or one value for all keys. Default 0 (exact). */
  tolerance?: number | Record<string, number>;
};

export type ScoreRunMetricsOptions = {
  /** When true, unknown metric ids (not in metricToLeaf) fail the result. */
  strict?: boolean;
};