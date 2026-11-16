import { describe, expect, it } from 'vitest';
import { toRetailSpec } from '@local-hosting/frameworks-presets';

import {
  compareScenarioMetrics,
  observationFromRunMetricsForSpec,
  runMetricsToLeafValues,
  scoreRunMetrics,
} from '../../src/method/score-run-metrics.js';

describe('compareScenarioMetrics', () => {
  it('requires exact match by default', () => {
    const result = compareScenarioMetrics(
      { peak_queue: 10 },
      { peak_queue: 11 },
    );
    expect(result.pass).toBe(false);
    expect(result.messages[0]).toContain('peak_queue');
  });

  it('honors per-key tolerance', () => {
    const result = compareScenarioMetrics(
      { clearance_time_s: 100 },
      { clearance_time_s: 103 },
      { tolerance: { clearance_time_s: 5 } },
    );
    expect(result.pass).toBe(true);
  });
});

describe('scoreRunMetrics', () => {
  it('maps known metric ids to leaf values', () => {
    const spec = {
      id: 'demo',
      grain: { entity: 'visit', period: 'episode' },
      metricToLeaf: { peak_queue: 'queue_depth' },
    };
    const result = scoreRunMetrics(spec, { peak_queue: 42, other: 1 });
    expect(result.leafValues).toEqual({ queue_depth: 42 });
    expect(result.pass).toBe(true);
  });

  it('strict mode fails on unmapped metrics', () => {
    const spec = {
      id: 'demo',
      grain: { entity: 'visit', period: 'episode' },
      metricToLeaf: { peak_queue: 'queue_depth' },
    };
    const result = scoreRunMetrics(spec, { peak_queue: 1, other: 2 }, { strict: true });
    expect(result.pass).toBe(false);
  });
});

describe('observationFromRunMetricsForSpec', () => {
  it('builds observation for retail preset subset', () => {
    const spec = toRetailSpec();
    const leafKeys = Object.keys(spec.metricToLeaf).slice(0, 2);
    const metrics = Object.fromEntries(
      leafKeys.map((id, i) => [id, i + 1]),
    );
    const leafValues = runMetricsToLeafValues(metrics, spec.metricToLeaf);
    expect(Object.keys(leafValues).length).toBe(leafKeys.length);

    const result = observationFromRunMetricsForSpec(spec, metrics);
    expect(result.observation?.methodId).toBe(spec.id);
    expect(result.observation?.leafValues).toEqual(leafValues);
  });
});