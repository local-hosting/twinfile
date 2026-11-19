# Memphis Cold Chain Hub

Illustrative **fulfillment / cold-storage** campus for multimodal cold-chain logistics. Layout is fiction; the pin is near Memphis cargo.

## Layout

- [`docs/layout.md`](docs/layout.md)
- `twin layout summary examples/cold-chain`

## Network places

Stories also involve:

- [`airport`](../airport/) — air-cargo intake (JFK)
- [`port`](../port/) — pier / warehouse ocean transfer (New Orleans)

## Runs

**Daily:** [`cold-chain-operations`](../../../story/examples/cold-chain-operations/) — airport intake → hub handoff → port transfer with [`cold-chain-dispatcher`](../../../character/examples/cold-chain-dispatcher/) (`mode: daily`).

**Resilience:** [`cold-chain-resilience`](../../../story/examples/cold-chain-resilience/) — cold-room power outage and apron storm hold (`mode: resilience`).
