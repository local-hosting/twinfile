import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { assembleRunRecords, sendRunCommands } from '../src/runners/run-commands.js';

describe('command records', () => {
  it('writes type command after the runner records and does not touch the feed', () => {
    const stdout = [
      JSON.stringify({ t: 0, type: 'phase', phase: 'warning' }),
      JSON.stringify({ t: 1, type: 'command', id: 'close-gate', device_id: 'gate' }),
      JSON.stringify({ t: 2, type: 'metric', id: 'clearance_time_s', value: 3 }),
    ].join('\n');
    const assembled = assembleRunRecords(stdout).split('\n');
    expect(JSON.parse(assembled[2] ?? '{}')).toMatchObject({ type: 'command' });
    expect(JSON.parse(assembled[0] ?? '{}')).toMatchObject({ type: 'phase' });

    const dir = mkdtempSync(join(tmpdir(), 'twin-command-'));
    const records = join(dir, 'run.jsonl');
    const feed = join(dir, 'stage.jsonl');
    writeFileSync(records, `${assembled.join('\n')}\n`);
    writeFileSync(feed, '{"device_id":"gauge-upstream","observed_property":"stage","value":1,"observed_at":"2026-06-12T13:00:00Z"}\n');
    const before = readFileSync(feed, 'utf8');
    expect(() => sendRunCommands(records, false)).toThrow(/consent/);
    expect(readFileSync(feed, 'utf8')).toBe(before);
    const sent = sendRunCommands(records, true);
    expect(sent.count).toBe(1);
    expect(readFileSync(sent.outPath, 'utf8')).toContain('"type":"command"');
    expect(readFileSync(feed, 'utf8')).toBe(before);
  });
});
