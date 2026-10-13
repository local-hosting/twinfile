import {
  listTwinResources,
  mcpResourceTemplates,
  openServedPlace,
  readTwinResource,
} from '@local-hosting/twinfile/place';
import { CORE_PACKAGE } from '@local-hosting/twinfile';

import {
  MCP_TOOLS,
  mcpToolMethod,
} from '@local-hosting/twinfile/mcp';

import { handleMcpRequest, type McpServeOptions } from './server.js';

export const MCP_PROTOCOL_VERSION = '2025-06-18';

const SUPPORTED_PROTOCOL_VERSIONS = new Set(['2024-11-05', '2025-03-26', '2025-06-18']);

export type McpSession = {
  initialized: boolean;
};

export type McpProtocolInput = {
  unitDir: string;
  options: McpServeOptions;
  session: McpSession;
  message: unknown;
};

type JsonRpcId = number | string | null;

type JsonRpcResult = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
};

export async function handleMcpProtocolMessage(input: McpProtocolInput): Promise<JsonRpcResult | undefined> {
  const message = asRequest(input.message);
  if (!message) {
    return rpcError(null, -32600, 'invalid request');
  }
  if (message.notification) {
    if (message.method === 'notifications/initialized') input.session.initialized = true;
    return undefined;
  }
  if (message.method === 'initialize') {
    input.session.initialized = false;
    const requested = typeof message.params?.protocolVersion === 'string' ? message.params.protocolVersion : '';
    return rpcResult(message.id, {
      protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.has(requested) ? requested : MCP_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
      serverInfo: { name: 'twinfile', version: CORE_PACKAGE.version },
      instructions:
        'Reads one served Twinfile place (one ref per MCP session). Canonical resources are twin://twinfile/<id>:<version>/place (Place.toWire), .../layers, .../processors, and twin://twinfile/<id>:<version>/place/{collection}/{id} for rows. Legacy aliases twin://place, twin://layers, twin://processors, and twin://place/{collection}/{id} resolve to the served unit. Also twin://runs/{run} and twin://processor-types. Use processors_validate for processor binds.',
    });
  }
  if (message.method === 'ping' || message.method === 'logging/setLevel') {
    return rpcResult(message.id, {});
  }
  if (!input.session.initialized) {
    return rpcError(message.id, -32600, 'server not initialized');
  }
  switch (message.method) {
    case 'tools/list':
      return rpcResult(message.id, {
        tools: MCP_TOOLS.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    case 'tools/call':
      return rpcResult(message.id, await callTool(input.unitDir, input.options, message.params));
    case 'resources/list':
      return listResources(input.unitDir, input.options, message.id);
    case 'resources/templates/list':
      return listResourceTemplates(input.unitDir, input.options, message.id);
    case 'resources/read':
      return readResource(input.unitDir, input.options, message.id, message.params);
    default:
      return rpcError(message.id, -32601, `method not found: ${message.method}`);
  }
}

export function runMcpStdio(unitDir: string, options: McpServeOptions = {}): void {
  const session: McpSession = { initialized: false };
  let buffer = Buffer.alloc(0);
  process.stdin.on('data', (chunk: Buffer | string) => {
    const next = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    buffer = Buffer.concat([buffer, next]);
    while (true) {
      const index = buffer.indexOf(0x0a);
      if (index < 0) break;
      const line = buffer.subarray(0, index).toString('utf8').replace(/\r$/, '');
      buffer = buffer.subarray(index + 1);
      if (!line.trim()) continue;
      void handleMcpProtocolLine(unitDir, line, options, session).then((out) => {
        if (out) process.stdout.write(`${JSON.stringify(out)}\n`);
      });
    }
  });
}

export async function handleMcpProtocolLine(
  unitDir: string,
  line: string,
  options: McpServeOptions,
  session: McpSession,
): Promise<JsonRpcResult | undefined> {
  let message: unknown;
  try {
    message = JSON.parse(line) as unknown;
  } catch {
    return rpcError(null, -32700, 'parse error');
  }
  return handleMcpProtocolMessage({ unitDir, options, session, message });
}

type ParsedRequest = {
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
  notification: boolean;
};

function asRequest(message: unknown): ParsedRequest | undefined {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return undefined;
  const row = message as Record<string, unknown>;
  if (row.jsonrpc !== '2.0' || typeof row.method !== 'string') return undefined;
  const id = row.id;
  const notification = id === undefined;
  if (!notification && typeof id !== 'string' && typeof id !== 'number' && id !== null) return undefined;
  const params = row.params;
  if (params !== undefined && (!params || typeof params !== 'object' || Array.isArray(params))) return undefined;
  return {
    id: notification ? null : (id as JsonRpcId),
    method: row.method,
    ...(params ? { params: params as Record<string, unknown> } : {}),
    notification,
  };
}

async function callTool(
  unitDir: string,
  options: McpServeOptions,
  params: Record<string, unknown> | undefined,
): Promise<Record<string, unknown>> {
  const name = typeof params?.name === 'string' ? params.name : '';
  const method = mcpToolMethod(name);
  if (!method) {
    return { content: [{ type: 'text', text: `unknown tool ${name}` }], isError: true };
  }
  const args = params?.arguments;
  const result = await handleMcpRequest(unitDir, {
    method,
    params: args && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : {},
  }, options);
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    ...(typeof result.error === 'string' ? { isError: true } : {}),
  };
}

async function listResources(unitDir: string, options: McpServeOptions, id: JsonRpcId): Promise<JsonRpcResult> {
  const listed = await listTwinResources(unitDir, options);
  if (!listed.ok) return rpcError(id, -32603, listed.error);
  return rpcResult(id, { resources: listed.resources });
}

async function listResourceTemplates(
  unitDir: string,
  options: McpServeOptions,
  id: JsonRpcId,
): Promise<JsonRpcResult> {
  const opened = await openServedPlace(unitDir, options);
  if (!opened.ok) return rpcError(id, -32603, opened.error);
  return rpcResult(id, { resourceTemplates: mcpResourceTemplates(opened.built.refKey) });
}

async function readResource(
  unitDir: string,
  options: McpServeOptions,
  id: JsonRpcId,
  params: Record<string, unknown> | undefined,
): Promise<JsonRpcResult> {
  const uri = typeof params?.uri === 'string' ? params.uri : '';
  if (!uri) return rpcError(id, -32602, 'uri is required');
  const read = await readTwinResource(unitDir, uri, options);
  if (!read.ok) return rpcError(id, -32602, read.error);
  return rpcResult(id, { contents: [{ uri: read.uri, mimeType: read.mimeType, text: read.text }] });
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcResult {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string): JsonRpcResult {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
