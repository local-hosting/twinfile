# John F. Kennedy International Airport

Illustrative **airport** campus for curb-to-gate flow and terminal shelter. Topology is fiction; the map pin is real.

## Layout

- Nested terminal: [`parts/terminal-a/`](parts/terminal-a/)
- CLI: `twin layout summary examples/airport`

## Runs

**Daily:** [`airport-operations`](../../../story/examples/airport-operations/airport-operations.twin.yaml) — passenger queue and transit disruption (`mode: daily`).

**Resilience:** [`airport-resilience`](../../../story/examples/airport-resilience/airport-resilience.twin.yaml) — severe-weather shelter and recovery (`mode: resilience`).

**Cold chain:** also an air-cargo leg in [`cold-chain-operations`](../../../story/examples/cold-chain-operations/) / [`cold-chain-resilience`](../../../story/examples/cold-chain-resilience/) with [`cold-chain`](../cold-chain/) and [`port`](../port/).
