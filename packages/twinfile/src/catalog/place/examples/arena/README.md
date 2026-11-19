# Madison Square Garden

Illustrative **arena** campus for game-day flow and storm shelter. Topology is fiction; the map pin is real.

## Layout

- Human map: [`docs/layout.md`](docs/layout.md)
- Nested concourse: [`parts/concourse/`](parts/concourse/)
- CLI: `twin layout summary examples/arena`

## Runs

**Daily:** [`arena-operations`](../../../story/examples/arena-operations/arena-operations.twin.yaml) — gate-open ramp (`mode: daily`).

**Resilience:** [`arena-resilience`](../../../story/examples/arena-resilience/arena-resilience.twin.yaml) — flood shelter, storm-at-halftime, earthquake, and wildfire (`mode: resilience`).
