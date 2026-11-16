#!/usr/bin/env node
/** One clock, several runners. Stdin is the usual runner payload plus scenario.runners. */
import { composeRunners } from './compose-runners.js';

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
});
process.stdin.on('end', () => {
  let payload: unknown;
  try {
    payload = JSON.parse(buf || '{}') as unknown;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const result = composeRunners(payload as Parameters<typeof composeRunners>[0]);
  for (const line of result.lines) console.log(line);
  if (result.exitCode !== 0) {
    console.error(result.error ?? 'compose: a runner failed');
    process.exit(result.exitCode);
  }
});
