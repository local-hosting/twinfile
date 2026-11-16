# MCP fixtures

## Run test prompts

Analyst questions for example **runs** live here, not in `preset.yaml`.

- **File:** [`run-test-prompts.yaml`](./run-test-prompts.yaml)
- **Schema:** `twinfile.mcp.run-test-prompts.v1`
- **Keys:** preset manifest `id` (e.g. `shop-shelter-at-cap`)

Simulator MCP tools `run_test_prompt` and `run_test_prompts` resolve this file when `TF_EXAMPLES_ROOT` points at `examples/`. `run_fork` may pass `test_prompt` explicitly, or use the catalog entry for the served run.
