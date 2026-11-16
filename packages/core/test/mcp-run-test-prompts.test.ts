import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { listMcpRunTestPrompts, mcpRunTestPromptForRun } from '../src/mcp/run-test-prompts.js';
import { testExamplesRoot } from './catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('mcp run test prompts', () => {
  it('lists golden run prompts keyed by preset id', () => {
    const rows = listMcpRunTestPrompts(examplesRoot);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.some((r) => r.runId === 'shop-shelter-at-cap' && r.prompt.includes('shelter'))).toBe(true);
  });

  it('resolves airport morning checkpoint', () => {
    const hit = mcpRunTestPromptForRun(examplesRoot, 'airport-morning-checkpoint');
    expect(hit?.prompt).toMatch(/checkpoint/i);
  });
});
