import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { handleMcpProtocolMessage, type McpSession } from '@doppler-group/twinfile-simulator';
import { goldenSceneRunDir, testExamplesRoot } from './test-examples-root.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));
const shop = join(examplesRoot, 'shop');
const arena = join(examplesRoot, 'arena');

function session(): McpSession {
  return { initialized: false };
}

async function rpc(
  unitDir: string,
  state: McpSession,
  method: string,
  params?: Record<string, unknown>,
  id: number | string = 1,
) {
  return handleMcpProtocolMessage({
    unitDir,
    options: { noCache: true },
    session: state,
    message: { jsonrpc: '2.0', id, method, ...(params ? { params } : {}) },
  });
}

async function ready(unitDir: string): Promise<McpSession> {
  const state = session();
  const init = await rpc(unitDir, state, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test', version: '0' },
  });
  expect(init?.result).toMatchObject({
    protocolVersion: '2025-06-18',
    serverInfo: { name: 'twinfile' },
    capabilities: { tools: {}, resources: {} },
  });
  const note = await handleMcpProtocolMessage({
    unitDir,
    options: { noCache: true },
    session: state,
    message: { jsonrpc: '2.0', method: 'notifications/initialized' },
  });
  expect(note).toBeUndefined();
  expect(state.initialized).toBe(true);
  return state;
}

describe('MCP protocol', () => {
  it('lists tools only after initialize', async () => {
    const state = session();
    const early = await rpc(shop, state, 'tools/list');
    expect(early?.error?.code).toBe(-32600);

    const readyState = await ready(shop);
    const listed = await rpc(shop, readyState, 'tools/list');
    const tools = (listed?.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name);
    expect(tools).toEqual(
      expect.arrayContaining([
        'place_init',
        'place_query',
        'place_card',
        'place_path',
        'explain',
        'narrate',
        'describe',
        'state_at',
        'run_test_prompt',
        'run_test_prompts',
      ]),
    );
  });

  it('loads golden run test prompt when serving a scenario', async () => {
    const runDir = goldenSceneRunDir(dirname(fileURLToPath(import.meta.url)), 'shop-shelter-at-cap');
    const state = await ready(runDir);
    const call = await rpc(runDir, state, 'tools/call', { name: 'run_test_prompt', arguments: {} });
    const body = JSON.parse((call?.result as { content: Array<{ text: string }> }).content[0]!.text) as {
      runId: string;
      prompt: string;
    };
    expect(body.runId).toBe('shop-shelter-at-cap');
    expect(body.prompt).toMatch(/shelter/i);
  });

  it('scaffolds a new place and still reads the served one', async () => {
    const state = await ready(shop);
    const dir = mkdtempSync(join(tmpdir(), 'twinfile-mcp-init-'));
    try {
      const call = await rpc(shop, state, 'tools/call', {
        name: 'place_init',
        arguments: { geotype: 'shopping_mall', dir, name: 'mall-demo', decorate: false },
      });
      const body = JSON.parse(
        (call?.result as { content: Array<{ text: string }> }).content[0]!.text,
      ) as { ok?: boolean; name?: string; error?: string };
      expect(body.error).toBeUndefined();
      expect(body.ok).toBe(true);
      expect(body.name).toBe('mall-demo');
      expect(readFileSync(join(dir, 'Twinfile.yaml'), 'utf8')).toContain('shopping_mall');

      const still = await rpc(shop, state, 'tools/call', {
        name: 'place_path',
        arguments: { from: 'sales-floor', to: 'stockroom' },
      });
      const pathBody = JSON.parse(
        (still?.result as { content: Array<{ text: string }> }).content[0]!.text,
      ) as { digest?: string; error?: string };
      expect(pathBody.error).toBeUndefined();
      expect(pathBody.digest).toEqual(expect.any(String));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('scaffolds the served directory when it is not a place yet', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'twinfile-mcp-empty-'));
    try {
      const state = await ready(empty);
      const call = await rpc(empty, state, 'tools/call', {
        name: 'place_init',
        arguments: { geotype: 'creek', decorate: false, from: false },
      });
      const body = JSON.parse(
        (call?.result as { content: Array<{ text: string }> }).content[0]!.text,
      ) as { ok?: boolean; dir?: string; error?: string };
      expect(body.error).toBeUndefined();
      expect(body.ok).toBe(true);
      expect(body.dir).toBe(empty);
      const twinfile = readFileSync(join(empty, 'Twinfile.yaml'), 'utf8');
      expect(twinfile).toContain('creek');
      expect(twinfile).not.toContain('from:');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('answers a path question and reads place resources', async () => {
    const state = await ready(shop);
    const call = await rpc(shop, state, 'tools/call', {
      name: 'place_path',
      arguments: { from: 'sales-floor', to: 'stockroom' },
    });
    const body = JSON.parse((call?.result as { content: Array<{ text: string }> }).content[0]!.text) as {
      digest: string;
      path: { openings: string[] };
    };
    expect(body.digest).toMatch(/^sha256:/);
    expect(body.path.openings).toEqual(['door-stock']);

    const filtered = await rpc(shop, state, 'tools/call', {
      name: 'place.query',
      arguments: { collection: 'spaces', kind: 'retail' },
    });
    const rows = JSON.parse((filtered?.result as { content: Array<{ text: string }> }).content[0]!.text) as {
      records: Array<{ id: string }>;
    };
    expect(rows.records.map((row) => row.id)).toEqual(['sales-floor']);

    const shopRef = 'twinfile/shop:0.2.0';
    const wireRes = await rpc(shop, state, 'resources/read', { uri: `twin://${shopRef}/place` });
    const wireText = (wireRes?.result as { contents: Array<{ text: string }> }).contents[0]!.text;
    const wire = JSON.parse(wireText) as { refKey: string; digest: string };
    expect(wire.refKey).toBe(shopRef);
    expect(wire.digest).toBe(body.digest);

    const legacyWire = await rpc(shop, state, 'resources/read', { uri: 'twin://place' });
    expect(JSON.parse((legacyWire?.result as { contents: Array<{ text: string }> }).contents[0]!.text).digest).toBe(
      body.digest,
    );

    const wrongRef = await rpc(shop, state, 'resources/read', { uri: 'twin://twinfile/arena:1.2.0/place' });
    expect(wrongRef?.error?.message).toMatch(/ref mismatch/);

    const row = await rpc(shop, state, 'resources/read', {
      uri: `twin://${shopRef}/place/spaces/sales-floor`,
    });
    const placeRow = JSON.parse((row?.result as { contents: Array<{ text: string }> }).contents[0]!.text) as {
      digest: string;
      id: string;
    };
    expect(placeRow).toMatchObject({ digest: body.digest, id: 'sales-floor' });

    const layers = await rpc(shop, state, 'resources/read', { uri: `twin://${shopRef}/layers` });
    const layerBody = JSON.parse((layers?.result as { contents: Array<{ text: string }> }).contents[0]!.text) as {
      layers: unknown[];
    };
    expect(layerBody.layers.length).toBeGreaterThan(0);

    const missing = await rpc(shop, state, 'resources/read', { uri: 'twin://runs/missing' });
    expect(missing?.error?.message).toMatch(/no run missing/);

    const templates = await rpc(shop, state, 'resources/templates/list');
    const uris = (templates?.result as { resourceTemplates: Array<{ uriTemplate: string }> }).resourceTemplates.map(
      (template) => template.uriTemplate,
    );
    expect(uris).toEqual([`twin://${shopRef}/place/{collection}/{id}`, 'twin://runs/{run}']);
  });

  it('exposes twin://processors with graph and ui for canvas hosts', async () => {
    const state = await ready(arena);
    const listed = await rpc(arena, state, 'resources/list');
    const uris = (listed?.result as { resources: Array<{ uri: string }> }).resources.map((r) => r.uri);
    expect(uris).toContain('twin://twinfile/arena:1.2.0/processors');

    const read = await rpc(arena, state, 'resources/read', { uri: 'twin://twinfile/arena:1.2.0/processors' });
    const body = JSON.parse((read?.result as { contents: Array<{ text: string }> }).contents[0]!.text) as {
      schema: string;
      digest: string;
      graph: { modules: Array<{ id: string }> };
      ui: { schema: string; modules: unknown[]; connections: unknown[] };
    };
    expect(body.schema).toBe('twinfile.processors.resource.v1');
    expect(body.digest).toMatch(/^sha256:/);
    expect(body.graph.modules.length).toBeGreaterThan(0);
    expect(body.ui.schema).toBe('twinfile.patch.ui.v1');
    expect(body.ui.modules.length).toBe(body.graph.modules.length);
    expect(body.ui.connections.length).toBeGreaterThan(0);
  });

  it('reads a run record written under the place', async () => {
    const root = mkdtempSync(join(tmpdir(), 'twinfile-mcp-'));
    writeFileSync(
      join(root, 'Twinfile.yaml'),
      `twinfile: 1
kind: place
id: demo
name: Demo
version: 1.0.0
stability: example
layers:
  - place/place.yaml
  - place/spaces.yaml
`,
    );
    mkdirSync(join(root, 'place'), { recursive: true });
    writeFileSync(
      join(root, 'place/place.yaml'),
      `place:
  name: Demo
  kind: shop
  timezone: UTC
  published: false
  archetype: single_level
`,
    );
    writeFileSync(
      join(root, 'place/spaces.yaml'),
      `spaces:
  - id: lobby
    kind: zone
`,
    );
    mkdirSync(join(root, 'runs'), { recursive: true });
    writeFileSync(join(root, 'runs', 'demo.jsonl'), '{"t":0,"type":"metric"}\n');

    const state = await ready(root);
    const listed = await rpc(root, state, 'resources/list');
    const uris = (listed?.result as { resources: Array<{ uri: string }> }).resources.map((resource) => resource.uri);
    expect(uris).toContain('twin://runs/demo');

    const read = await rpc(root, state, 'resources/read', { uri: 'twin://runs/demo' });
    const body = JSON.parse((read?.result as { contents: Array<{ text: string }> }).contents[0]!.text) as {
      digest: string;
      records: string;
    };
    expect(body.digest).toMatch(/^sha256:/);
    expect(body.records).toContain('"type":"metric"');
  });
});
