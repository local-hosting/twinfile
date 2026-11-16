/**
 * Scenario success evaluation (`expected/metrics.json` vs run `*.metrics.json`).
 * Flat compare uses @local-hosting/twinfile-core/method; planning KPI schemas live in @local-hosting/frameworks.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { compareScenarioMetrics, type MetricsEvalResult } from '@local-hosting/twinfile-core/method';

export type EvalResult = MetricsEvalResult;

export function evalRunPreset(presetDir: string, runsDir?: string): EvalResult {
  const expected = join(presetDir, 'expected', 'metrics.json');
  if (!existsSync(expected)) {
    return { pass: true, messages: ['no expected/metrics.json — skip'] };
  }
  const runs = runsDir ?? join(presetDir, 'runs');
  const observed = join(runs, 'latest.metrics.json');
  if (!existsSync(observed)) {
    return { pass: false, messages: [`missing observed metrics: ${observed}`] };
  }
  const exp = JSON.parse(readFileSync(expected, 'utf8')) as Record<string, number>;
  const obs = JSON.parse(readFileSync(observed, 'utf8')) as Record<string, number>;
  return compareScenarioMetrics(exp, obs);
}