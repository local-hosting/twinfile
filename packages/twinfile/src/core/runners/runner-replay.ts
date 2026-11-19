#!/usr/bin/env node
/** Threshold replay over a scenario timeline (stdin JSON protocol → JSONL stdout). */
import { runReplayLines } from './builtin-runners.js';

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
});
process.stdin.on('end', () => {
  try {
    const lines = runReplayLines(JSON.parse(buf || '{}') as Parameters<typeof runReplayLines>[0]);
    for (const line of lines) console.log(line);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});
