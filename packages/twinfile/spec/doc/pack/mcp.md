# MCP

`twin serve <dir> --stdio` speaks [MCP](https://modelcontextprotocol.io) JSON-RPC on stdin and stdout, newline-delimited. The process reads one place directory, and `place_init` can scaffold another (or that same directory, when it is not a place yet) with the same path as `twin init place --geotype`. `--allow-runs` is required before `run_fork` or `run_append` will start a runner.

Handshake: `initialize`, then the `notifications/initialized` notification. After that the client may call `tools/list`, `tools/call`, `resources/list`, `resources/templates/list`, and `resources/read`.

Tools (underscore names; dotted forms such as `place.query` are accepted on `tools/call`):

| Tool | Question |
| --- | --- |
| `place_init` | Scaffold a place. `geotype` is required. `dir` defaults to the served directory; `name`, `from` (default true), and `decorate` (default true) match `twin init place`. Response: `suggestedLayers`, `layerHints` (e.g. when `visits` is suggested — optional visit moments, not runtime movement) |
| `place_query` | Rows in one collection, filtered by id, role, level, kind, space, or `ext_key` / `ext_value` |
| `place_card` | **TwinfileSummaryV1** in `card` (place layout blocks for UI), `ascii`; HTML is host-rendered (product UI pack) — CLI prints ascii / json / yaml / markdown via `twin summary` |
| `bridge_import` | Bridge import to an output directory (same as `twin import --bridge`) |
| `place_path` | Walk `from`/`to`, or spaces reachable from a role. `step_free` drops stairs |
| `explain` | One row, or one field on that row |
| `narrate` | Markdown description (`describe` is the same tool) |
| `state_at` | Timeline sample at `t`, `at`, or `localAt` |
| `twin_match` | Plan expects against the merged place |
| `run_fork`, `run_append` | Run the scenario runner when `--allow-runs` was set. Preset Twinfiles do not carry a `question:` field — optional analyst copy comes from `run_test_prompt` or from `test_prompt` on the fork call (injected as `scenario.test_prompt` on runner stdin) |
| `run_test_prompt` | Golden test prompt for the served run's preset `id` (`examples/mcp/run-test-prompts.yaml` in the place catalog) |
| `run_test_prompts` | List all cataloged run test prompts |
| `processors_validate` | Validate `processors:` outlets and binds against the merged place |
| `twin_audit` | Believability card for any twin unit (`dir`, `format`, `brief`) — same as `twin audit` CLI |

`place_path` walks the merged place (see [Layout navigation](../place/layout-navigation.md#path-query)).

`narrate` returns Markdown (`markdown` inside the tool JSON) with `## Place`, `## Scenario`, `## Event`, `## Now`, plus grouped `facts` and `sections`.

Resources:

| URI | Body |
| --- | --- |
| `twin://twinfile/<id>:<version>/place` | Wire JSON — `refKey`, `Place.toWire()` fields (`meta`, merged `place`, `digest`) |
| `twin://twinfile/<id>:<version>/layers` | `refKey`, `digest`, layer chain (`ref`, `kind`, `chain`) |
| `twin://twinfile/<id>:<version>/place/{collection}/{id}` | One row (`refKey`, `digest`, row fields) |
| `twin://twinfile/<id>:<version>/processors` | Processor resource when `processors:` is set |
| `twin://runs/{run}` | That run's JSON Lines records (served unit only) |
| `twin://processor-types` | `twinfile.processor-types.v1` — module type catalog for canvas palettes |

**Session aliases** (same ref as the served directory): `twin://place`, `twin://layers`, `twin://processors`, `twin://place/{collection}/{id}`. Reading a **different** `twinfile/<id>:<version>` on that session returns `ref mismatch`.

`resources/list` advertises ref-scoped URIs for the built unit (`refKey` from `<unit>.twin.lock`). Row and run templates use the served `refKey`.

Read-tool results and resource bodies include `Place.digest`. `place_init` returns the new directory, `suggestedLayers`, `layerHints`, and `digest: null`, because that place has not been built.
