import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'yaml';

import { resolveExamplesRoot } from '../paths/resolve-examples-root.js';
import { resolveTwinfileRoot } from '../paths/catalog-layout.js';
import { isRecord } from '../doc/is-record.js';

export const MCP_RUN_TEST_PROMPTS_REL = 'mcp/run-test-prompts.yaml';
const CLI_MCP_REL = 'packages/twinfile/src/catalog/place/examples/mcp/run-test-prompts.yaml';

export type McpRunTestPromptsDoc = {
  schema?: string;
  prompts: Record<string, string>;
};

export function resolveMcpRunTestPromptsPath(examplesRoot?: string): string | undefined {
  const twinRoot = resolveTwinfileRoot();
  const cliPath = join(twinRoot, CLI_MCP_REL);
  if (statSync(cliPath, { throwIfNoEntry: false })?.isFile()) return cliPath;
  if (examplesRoot) {
    const legacy = join(examplesRoot, MCP_RUN_TEST_PROMPTS_REL);
    if (statSync(legacy, { throwIfNoEntry: false })?.isFile()) return legacy;
  }
  return undefined;
}

/** Load golden-run test prompts from `packages/twinfile/src/catalog/place/examples/mcp/run-test-prompts.yaml`. */
export function loadMcpRunTestPrompts(examplesRoot?: string): McpRunTestPromptsDoc | undefined {
  const root = examplesRoot ?? resolveExamplesRoot();
  const path = resolveMcpRunTestPromptsPath(root);
  if (!path) return undefined;
  const doc = parse(readFileSync(path, 'utf8'));
  if (!isRecord(doc) || !isRecord(doc.prompts)) return undefined;
  const prompts: Record<string, string> = {};
  for (const [id, value] of Object.entries(doc.prompts)) {
    if (typeof value === 'string' && value.trim()) prompts[id] = value.trim();
  }
  return {
    ...(typeof doc.schema === 'string' ? { schema: doc.schema } : {}),
    prompts,
  };
}

export function listMcpRunTestPrompts(examplesRoot?: string): Array<{ runId: string; prompt: string }> {
  const loaded = loadMcpRunTestPrompts(examplesRoot);
  if (!loaded) return [];
  return Object.entries(loaded.prompts)
    .map(([runId, prompt]) => ({ runId, prompt }))
    .sort((a, b) => a.runId.localeCompare(b.runId));
}

export function mcpRunTestPromptForRun(
  examplesRoot: string | undefined,
  runId: string,
): { runId: string; prompt: string } | undefined {
  const loaded = loadMcpRunTestPrompts(examplesRoot);
  const prompt = loaded?.prompts[runId];
  if (!prompt) return undefined;
  return { runId, prompt };
}

export function resolveMcpRunTestPromptsRoot(unitDir: string): string | undefined {
  return resolveExamplesRoot(unitDir);
}
