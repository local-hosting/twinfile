import { runHydraulicLines, runQueueLines, runReplayLines } from './builtin-runners.js';

export type ComposeChild = { id: string; runner: string };

export type ComposePayload = {
  scenario?: { runners?: ComposeChild[]; args?: Record<string, unknown> };
} & Record<string, unknown>;

export type ComposeResult = {
  exitCode: number;
  lines: string[];
  error?: string;
};

type Tagged = { t: number; order: number; seq: number; line: string };

function childLines(runner: string, payload: Record<string, unknown>): string[] {
  if (runner.includes('runner-hydraulic')) return runHydraulicLines(payload as Parameters<typeof runHydraulicLines>[0]);
  if (runner.includes('runner-queue')) return runQueueLines(payload as Parameters<typeof runQueueLines>[0]);
  if (runner.includes('runner-replay')) return runReplayLines(payload as Parameters<typeof runReplayLines>[0]);
  throw new Error(`unknown runner ${runner}`);
}

function prefix(id: string, line: string): { t: number; line: string } {
  const row = JSON.parse(line) as Record<string, unknown>;
  if (typeof row.t !== 'number') throw new Error(`compose: ${id} record is missing numeric t`);
  const next: Record<string, unknown> = { runner: id };
  for (const [key, value] of Object.entries(row)) {
    if (key === 'runner') continue;
    next[key] = value;
  }
  return { t: row.t, line: JSON.stringify(next) };
}

/**
 * Run each child on a copy of the same stdin payload (bundle + timeline).
 * Children do not see each other's stdout. Lines merge by `t`.
 */
export function composeRunners(payload: ComposePayload): ComposeResult {
  const runners = payload.scenario?.runners;
  if (!Array.isArray(runners) || runners.length === 0) {
    return { exitCode: 1, lines: [], error: 'compose: use.runners is empty' };
  }
  const tagged: Tagged[] = [];
  for (let order = 0; order < runners.length; order += 1) {
    const child = runners[order];
    if (!child || typeof child.id !== 'string' || typeof child.runner !== 'string') {
      return { exitCode: 1, lines: [], error: 'compose: each runner needs id and runner' };
    }
    const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    let lines: string[];
    try {
      lines = childLines(child.runner, copy);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 1, lines: [], error: `compose: ${child.id}: ${message}` };
    }
    lines.forEach((line, seq) => {
      const prefixed = prefix(child.id, line);
      tagged.push({ t: prefixed.t, order, seq, line: prefixed.line });
    });
  }
  tagged.sort((a, b) => a.t - b.t || a.order - b.order || a.seq - b.seq);
  return { exitCode: 0, lines: tagged.map((row) => row.line) };
}
