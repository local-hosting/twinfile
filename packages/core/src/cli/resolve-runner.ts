#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveRunnerCommand(
  runnerRef: string,
  distRoot: string,
): string[] {
  const exec = process.execPath;
  if (runnerRef.includes('runner-compose')) {
    return [exec, join(distRoot, 'runners/runner-compose.js')];
  }
  if (runnerRef.includes('runner-replay')) {
    return [exec, join(distRoot, 'runners/runner-replay.js')];
  }
  if (runnerRef.includes('runner-queue')) {
    return [exec, join(distRoot, 'runners/runner-queue.js')];
  }
  return [exec, join(distRoot, 'runners/runner-hydraulic.js')];
}

export function distRootFromCli(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}
