#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveRunnerCommand(
  runnerRef: string,
  distRoot: string,
): string[] {
  const exec = process.execPath;
  const ref = runnerRef.trim();
  if (!ref) {
    throw new Error('use.runner is required for offline twin run');
  }
  if (ref.includes('runner-compose')) {
    return [exec, join(distRoot, 'runners/runner-compose.js')];
  }
  if (ref.includes('runner-replay')) {
    return [exec, join(distRoot, 'runners/runner-replay.js')];
  }
  if (ref.includes('runner-queue')) {
    return [exec, join(distRoot, 'runners/runner-queue.js')];
  }
  if (ref.includes('runner-hydraulic')) {
    return [exec, join(distRoot, 'runners/runner-hydraulic.js')];
  }
  throw new Error(`unknown use.runner: ${ref}`);
}

export function distRootFromCli(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}
