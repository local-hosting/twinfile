#!/usr/bin/env node
/** Deterministic queue baseline for gates / lanes. */
import { runQueueLines } from './builtin-runners.js';

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
});
process.stdin.on('end', () => {
  const lines = runQueueLines(JSON.parse(buf || '{}') as Parameters<typeof runQueueLines>[0]);
  for (const line of lines) console.log(line);
});
