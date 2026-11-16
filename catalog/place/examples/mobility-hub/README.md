# Mobility hub examples

Three related units:

| Folder | Role | Map pin |
| --- | --- | --- |
| [`programme/`](programme/) | **Programme** — reusable fiction, no pin | — |
| [`mobility-hub.twin.yaml`](mobility-hub.twin.yaml) | **Site** — King's Cross pin on the programme (`from: twinfile/mobility-hub:0.1.0`) | yes |
| [`campus/`](campus/) | **Site** — multi-building campus (Pattern A) | yes |

The King's Cross **site** head stays thin on purpose: topology lives in the programme. Campus nested building: [`campus/parts/transit-hub/`](campus/parts/transit-hub/). See [`../PARTS.md`](../PARTS.md).

## Runs

**Site (King's Cross):** [`mobility-hub-operations`](../../../story/examples/mobility-hub-operations/) (`mode: daily`) · [`mobility-hub-resilience`](../../../story/examples/mobility-hub-resilience/) (`mode: resilience`).

**Campus:** [`transit-hub-campus-operations`](../../../story/examples/transit-hub-campus-operations/) (`mode: daily`) · [`transit-hub-campus-resilience`](../../../story/examples/transit-hub-campus-resilience/) (`mode: resilience`).
