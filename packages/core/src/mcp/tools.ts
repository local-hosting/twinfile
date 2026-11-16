export type McpToolDef = {
  name: string;
  method: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const str = { type: 'string' };
const num = { type: 'number' };
const bool = { type: 'boolean' };

function schema(properties: Record<string, unknown>, required: string[] = []): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false };
}

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: 'place_init',
    method: 'place.init',
    description:
      'Scaffold a new place the same way as twin init place --geotype. dir defaults to the served directory; pass another dir to create a second place while this server keeps the first. Response includes suggestedLayers and layerHints (e.g. when visits is suggested: optional visit moments, not runtime movement).',
    inputSchema: schema(
      {
        geotype: str,
        dir: str,
        name: str,
        from: bool,
        decorate: bool,
      },
      ['geotype'],
    ),
  },
  {
    name: 'place_query',
    method: 'place.query',
    description:
      'Filter rows in one place collection (spaces, services, assets, openings, routes, …). Use collection=services&space=<id> for capabilities at a cell.',
    inputSchema: schema({
      collection: str,
      id: str,
      role: str,
      level: str,
      kind: str,
      space: str,
      ext_key: str,
      ext_value: {},
      limit: num,
    }),
  },
  {
    name: 'bridge_import',
    method: 'bridge.import',
    description:
      'Import an external format through a bridge (same as twin import --bridge). Writes YAML layers under out; does not require a built place.',
    inputSchema: schema({ bridge: str, input: str, out: str }, ['bridge', 'input', 'out']),
  },
  {
    name: 'place_path',
    method: 'place.path',
    description: 'Shortest walk between two spaces, or the spaces reachable from a role. step_free drops stairs.',
    inputSchema: schema({ from: str, to: str, role: str, step_free: bool }),
  },
  {
    name: 'explain',
    method: 'explain',
    description: 'Read one row, or one field on that row.',
    inputSchema: schema({ collection: str, id: str, field: str }, ['collection', 'id']),
  },
  {
    name: 'place_card',
    method: 'place.card',
    description:
      'Twinfile card projection (JSON + Markdown): header, signal I/O for sites; fixed/variables for runs and catalog units.',
    inputSchema: schema({}),
  },
  {
    name: 'narrate',
    method: 'narrate',
    description: 'Describe the place in Markdown, including the clock sample when the scenario has one.',
    inputSchema: schema({ space: str, t: num, seed: num }),
  },
  {
    name: 'describe',
    method: 'narrate',
    description: 'Alias of narrate.',
    inputSchema: schema({ space: str, t: num, seed: num }),
  },
  {
    name: 'state_at',
    method: 'state.at',
    description: 'Place and timeline sample at a clock instant. Pass t in seconds, or at / localAt.',
    inputSchema: schema({ t: num, at: str, localAt: str, seed: num }),
  },
  {
    name: 'twin_match',
    method: 'twin.match',
    description: 'Check plan expects against the merged place.',
    inputSchema: schema({ expects: { type: 'object' }, planRoles: { type: 'object' } }),
  },
  {
    name: 'run_test_prompt',
    method: 'run.test.prompt',
    description:
      'Golden-run analyst prompt for MCP/CI testing (from examples/mcp/run-test-prompts.yaml). Not stored on the scene run.',
    inputSchema: schema({ runId: str }),
  },
  {
    name: 'run_test_prompts',
    method: 'run.test.prompts',
    description: 'List all golden-run test prompts when TF_TWINFILE_ROOT resolves.',
    inputSchema: schema({}),
  },
  {
    name: 'run_fork',
    method: 'run.fork',
    description:
      'Run the scenario runner. Requires --allow-runs. Optional test_prompt overrides the MCP catalog prompt for this run id.',
    inputSchema: schema({ runName: str, seed: num, args: { type: 'object' }, test_prompt: str }),
  },
  {
    name: 'run_append',
    method: 'run.append',
    description: 'Append a run under an explicit name. Requires --allow-runs.',
    inputSchema: schema({ runName: str, seed: num, args: { type: 'object' } }),
  },
  {
    name: 'processors_validate',
    method: 'processors.validate',
    description:
      'Validate manifest processors: wiring (outlets, binds) against the merged place — same rules as twin check --profile processors.',
    inputSchema: schema({}),
  },
];

export function mcpToolMethod(name: string): string | undefined {
  const key = name.replace(/\./g, '_');
  return MCP_TOOLS.find((tool) => tool.name === key)?.method;
}
