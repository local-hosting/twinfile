import type { Grain, MethodSpec } from '@doppler-group/frameworks-core/measurement';
import { methodFromSpec, observationFromLeaves } from '@doppler-group/frameworks-presets';

import type {
  CompareScenarioMetricsOptions,
  MetricsEvalResult,
  ScoreRunMetricsOptions,
} from './types/scenario-eval.js';

function toleranceFor(
  key: string,
  tolerance: CompareScenarioMetricsOptions['tolerance'],
): number {
  if (tolerance === undefined) return 0;
  if (typeof tolerance === 'number') return tolerance;
  return tolerance[key] ?? 0;
}

/** Exact or tolerant compare of flat run `*.metrics.json` payloads (simulator contract). */
export function compareScenarioMetrics(
  expected: Record<string, number>,
  observed: Record<string, number>,
  options?: CompareScenarioMetricsOptions,
): MetricsEvalResult {
  const messages: string[] = [];
  for (const [key, want] of Object.entries(expected)) {
    const got = observed[key];
    if (typeof got !== 'number') {
      messages.push(`${key}: expected ${want}, missing or non-numeric`);
      continue;
    }
    const tol = toleranceFor(key, options?.tolerance);
    if (Math.abs(got - want) > tol) {
      messages.push(
        tol > 0
          ? `${key}: expected ${want} ±${tol}, got ${got}`
          : `${key}: expected ${want}, got ${got}`,
      );
    }
  }
  return { pass: messages.length === 0, messages };
}

/** Project simulator metric ids onto driver-tree leaf ids via a method `metricToLeaf` map. */
export function runMetricsToLeafValues(
  metrics: Record<string, number>,
  metricToLeaf: Record<string, string>,
): Record<string, number> {
  const leafValues: Record<string, number> = {};
  for (const [metricId, value] of Object.entries(metrics)) {
    const leafId = metricToLeaf[metricId];
    if (leafId === undefined) continue;
    leafValues[leafId] = value;
  }
  return leafValues;
}

export function observationFromRunMetrics(
  methodId: string,
  grain: Grain,
  metrics: Record<string, number>,
  metricToLeaf: Record<string, string>,
): MetricsEvalResult['observation'] {
  return {
    specVersion: '1.0',
    methodId,
    grain,
    leafValues: runMetricsToLeafValues(metrics, metricToLeaf),
  };
}

/**
 * Map a run metrics blob to a frameworks `MethodObservation` and report unlinked ids.
 * Use after a scenario run when a `MethodSpec` (or subset) is available for scoring lift / HEART coverage.
 */
export function scoreRunMetrics(
  spec: Pick<MethodSpec, 'id' | 'grain' | 'metricToLeaf'>,
  metrics: Record<string, number>,
  options?: ScoreRunMetricsOptions,
): MetricsEvalResult {
  const leafValues = runMetricsToLeafValues(metrics, spec.metricToLeaf);
  const observation = observationFromRunMetrics(
    spec.id,
    spec.grain,
    metrics,
    spec.metricToLeaf,
  );
  const linked = new Set(Object.keys(spec.metricToLeaf));
  const unmatched = Object.keys(metrics).filter((id) => !linked.has(id));
  const messages =
    options?.strict === true && unmatched.length > 0
      ? [`metrics not in method spec: ${unmatched.join(', ')}`]
      : [];
  return {
    pass: messages.length === 0,
    messages,
    leafValues,
    observation,
  };
}

/** Hydrate a preset method and build an observation from run metrics (for lift tree evaluation). */
export function observationFromRunMetricsForSpec(
  spec: MethodSpec,
  metrics: Record<string, number>,
): MetricsEvalResult {
  const method = methodFromSpec(spec);
  const leafValues = runMetricsToLeafValues(metrics, spec.metricToLeaf);
  const observation = observationFromLeaves(method, leafValues);
  return {
    pass: true,
    messages: [],
    leafValues,
    observation,
  };
}