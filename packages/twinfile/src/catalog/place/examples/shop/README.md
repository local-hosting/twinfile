# Starbucks Pike Place

Retail **place** twin (`twinfile/shop:0.2.0`) pinned on the **Starbucks at 1912 Pike Place**, Seattle (Pike Place Market) on `base-indoor-stack`: sales floor, stockroom, curbside pickup, plans, DTPR (`assets`, `sensors`, `ai`).

## Live controls (preferred)

After `twin build`, **`Place.meta.placeType.controls`** lists programme buttons wired to **`signal:trigger`** (`passenger-queue`, `severe-weather`, `transit-disruption`). Hosts and workbench publish **`twin:event`** / trigger pulses — same events as in the simulator package README, not separate shop child units.

See [patch graph](../../../../../spec/doc/pack/patch.md#event-pulses-twinevent).

## Offline run (CI / MCP)

**Daily:** [`shop-visit`](../../../story/examples/shop-visit/shop-visit.twin.yaml) — sales-floor arrival and checkout (`mode: daily`).

**Resilience:** [`shelter-at-cap`](../../../story/examples/shop-resilience/shop-resilience.twin.yaml) — `twin run` against severe-weather (`mode: resilience`). Product demos should use **pulses on the place**, not extra scenes per button.
