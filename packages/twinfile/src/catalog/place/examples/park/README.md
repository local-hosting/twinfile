# Central Park

Illustrative **`open_area`** site pinned at **Central Park, Manhattan** (`meadow`, `trailhead`). Topology is fiction — not a claim about real paths or closures.

## Layout

- Human map: [`docs/layout.md`](docs/layout.md)
- Agent regions: [`ext/layout-index.yaml`](ext/layout-index.yaml)
- CLI: `twin layout summary examples/park`

## Runs

**Daily:** [`park-operations`](../../../story/examples/park-operations/park-operations.twin.yaml) — meadow loop and trailhead queue (`mode: daily`).

**Resilience:** [`park-resilience`](../../../story/examples/park-resilience/park-resilience.twin.yaml) — litter surge and slope-movement watch (`mode: resilience`). **Analyst intent** lives in [`mcp/`](../mcp/), not in the scene `run:`. Live demos use event **pulses** on the place, not extra scenes per button.
