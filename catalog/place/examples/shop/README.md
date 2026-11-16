# Starbucks Pike Place

Retail **place** twin (`twinfile/shop:0.2.0`) pinned on the **Starbucks at 1912 Pike Place**, Seattle (Pike Place Market) on `base-indoor-stack`: sales floor, stockroom, curbside pickup, plans, DTPR (`assets`, `sensors`, `ai`).

## Live controls (preferred)

After `twin build`, **`Place.meta.placeType.controls`** lists programme buttons wired to **`signal:trigger`** (`passenger-queue`, `severe-weather`, `transit-disruption`). Hosts and workbench publish **`twin:situation`** / trigger pulses — same situations as in the simulator package README, not separate shop child units.

See [patch graph](../../../../packages/spec/doc/pack/patch.md#situation-pulses-twinsituation).

## Offline run (CI / MCP)

**One** reference scenario: [`scenarios/shelter-at-cap`](../../../story/examples/shop-visit/scenes/shop-shelter-at-cap) — `twin run` / `twin verify` against severe-weather + hydraulic runner. Product demos should use **pulses on the place**, not extra scenario folders per button.
