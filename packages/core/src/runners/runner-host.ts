import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { assembleRunRecords } from './run-commands.js';

export type RunHostOptions = {
  runnerCommand: string[];
  payload: Record<string, unknown>;
  runsDir: string;
  runName: string;
};

export type RunHostResult = {
  recordsPath: string;
  metricsPath: string;
  metrics: Record<string, number>;
};

export async function runScenarioRunner(options: RunHostOptions): Promise<RunHostResult> {
  mkdirSync(options.runsDir, { recursive: true });
  const recordsPath = join(options.runsDir, `${options.runName}.jsonl`);
  const metricsPath = join(options.runsDir, `${options.runName}.metrics.json`);

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(options.runnerCommand[0]!, options.runnerCommand.slice(1), {
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    let out = '';
    child.stdout.on('data', (chunk) => {
      out += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`runner exit ${code}`));
      else resolve(out);
    });
    child.stdin.write(JSON.stringify(options.payload));
    child.stdin.end();
  });

  const records = assembleRunRecords(stdout);
  writeFileSync(recordsPath, records ? `${records}\n` : '');

  const metrics: Record<string, number> = {};
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as { type?: string; id?: string; value?: number };
    if (row.type === 'metric' && row.id && typeof row.value === 'number') {
      metrics[row.id] = row.value;
    }
  }
  writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  return { recordsPath, metricsPath, metrics };
}

export function digestFile(path: string): string {
  const body = readFileSync(path);
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}
