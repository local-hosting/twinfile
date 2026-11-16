#!/usr/bin/env node
/** Deterministic egress/shelter baseline runner (stdin JSON protocol → JSONL stdout). */
import { createInterface } from 'node:readline';

import { runHydraulicLines } from './builtin-runners.js';

const rl = createInterface({ input: process.stdin });
let buf = '';
rl.on('line', (line) => {
  buf += line;
});
rl.on('close', () => {
  const lines = runHydraulicLines(JSON.parse(buf || '{}') as Parameters<typeof runHydraulicLines>[0]);
  for (const line of lines) console.log(line);
});
