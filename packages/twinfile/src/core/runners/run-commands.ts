import { readFileSync, writeFileSync } from 'node:fs';

type RunRow = { type?: string };

function parseLine(line: string): RunRow {
  return JSON.parse(line) as RunRow;
}

/** Metric and phase lines first; `type: command` only after the runner has exited. */
export function assembleRunRecords(stdout: string): string {
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const body: string[] = [];
  const commands: string[] = [];
  for (const line of lines) {
    const row = parseLine(line);
    if (row.type === 'command') commands.push(line);
    else body.push(line);
  }
  return [...body, ...commands].join('\n');
}

export type SendCommandsResult = { outPath: string; count: number };

/**
 * Transmit command records. Consent matches executing a runner: the caller must opt in.
 * This does not read or write feed files, so it cannot change the next sample.
 */
export function sendRunCommands(recordsPath: string, consent: boolean): SendCommandsResult {
  if (!consent) {
    throw new Error('sending a command needs the same consent as executing a runner (--allow-send)');
  }
  const commands = readFileSync(recordsPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => parseLine(line).type === 'command');
  const outPath = recordsPath.replace(/\.jsonl$/, '') + '.sent.jsonl';
  writeFileSync(outPath, commands.length > 0 ? `${commands.join('\n')}\n` : '');
  return { outPath, count: commands.length };
}
