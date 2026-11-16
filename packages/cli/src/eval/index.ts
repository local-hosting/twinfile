/**
 * Scene success evaluation (`run.expected.metrics` vs run `*.metrics.json`).
 * Flat compare uses @local-hosting/twinfile-core/method; planning KPI schemas live in @local-hosting/frameworks.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { loadRunUnit } from '@local-hosting/twinfile-core';
import { compareScenarioMetrics, type MetricsEvalResult } from '@local-hosting/twinfile-core/method';

export type EvalResult = MetricsEvalResult;

/** Compare a scene's `run.expected.metrics` with observed `<runs>/latest.metrics.json`. */
export function evalSceneRun(target: string, runsDir?: string): EvalResult {
  const loaded = loadRunUnit(target);
  if (!loaded.ok) return { pass: false, messages: loaded.errors.map((e) => e.message) };
  const expected = loaded.value.scene?.expected?.metrics;
  if (!expected) return { pass: true, messages: ['no run.expected.metrics — skip'] };
  const observed = join(runsDir ?? join(loaded.value.root, 'runs'), 'latest.metrics.json');
  if (!existsSync(observed)) {
    return { pass: false, messages: [`missing observed metrics: ${observed}`] };
  }
  const obs = JSON.parse(readFileSync(observed, 'utf8')) as Record<string, number>;
  return compareScenarioMetrics(expected, obs);
}
