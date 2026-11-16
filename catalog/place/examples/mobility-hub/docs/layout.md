# Future mobility hubs — kit of parts

**Programme:** [`programme/programme.twin.yaml`](../programme/programme.twin.yaml) (`twinfile/mobility-hub:0.1.0`) — full kit topology, services, assets, plan (no map pin).

**Map pin:** [`mobility-hub.twin.yaml`](../mobility-hub.twin.yaml) (**King's Cross, London**) — `from: twinfile/mobility-hub:0.1.0`, one step patches **`place.ext`** only. **Campus-shaped mobility hub** (same type, nested building): [`campus/`](../campus/) — `from: twinfile/base-campus`, `place.kind: mobility_hub`, ref id `transit-hub-campus` for the published catalog entry.

**Scenario:** [`mobility-hub-hub-disruption`](../../../../story/examples/mobility-hub-operations/mobility-hub-operations.twin.yaml) — `transit-disruption` queue on suburban rail/bus feed (`catalog/story/examples/mobility-hub-operations#mobility-hub-hub-disruption`).

Hierarchy: programme template → geo instance; within the bundle, `parent` rollup (network → site → `programme_zone` / `building` → parts); **`services[]`** links board kinds to space cells; **`assets[]`** are equipment at those cells.

## Compose steps

| Step | Content |
| --- | --- |
| 1 | Site programme (`place`, `levels`) |
| 2 | Network tiers, **site analysis** (`ext.analysis`), **design intent** (`ext.design_intent`), **programme zones** |
| 3 | Built program cells (`exposure`, `ext.use` where noted) |
| 4 | Circulation (`openings`, `routes`), fixtures (`assets`), `plan` |

## Site analysis (planner view)

| Site `id` | `typology` | `urban_context` | `trip_purpose` | `design_intent` (sample) |
| --- | --- | --- | --- | --- |
| `rural-node` | node | rural | destination | user_focus, dwell_quality |
| `rural-hub` | hub | rural | entry, destination | placemaking, active_mobility |
| `suburban-hub` | hub | suburban | transfer, destination | transit_integration, network_connectivity |
| `urban-hub` | hub | urban_centre | entry, transfer, destination | dwell_quality, transit_integration, public_realm, sustainability, adaptability |

## Program zones (urban hub)

| Zone `id` | `ext.programme` |
| --- | --- |
| `urban-mobility-modules` | mobility |
| `urban-core-modules` | mobility (`programme_detail: transit_core`) |
| `urban-community` | community |
| `urban-environmental` | landscape |

## Services (mobility + community boards)

Canonical `kind` values live in [`mob-hub-services.yaml`](../../../../../packages/spec/conf/mob-hub-services.yaml). Step **`services:`** in `<unit>.twin.yaml` binds each `kind` to a **space** (the cell). **`assets[]`** remain physical resources (chargers, displays).

Urban **community wireframe** modules: bakery, bank/post, café, delivery, energy, event, restaurant, garden, indoor public space, meeting, co-working, outdoor seating — mostly under `urban-community`. Indoor programme is **`copy: ./parts/urban-services-building`** (own Twinfile; room ids like `urban-services-building-hall`).

## Suburban hub (sample cells)

| Space `id` | Role |
| --- | --- |
| `suburban-pavilion`, `suburban-cycle-hub` | Shelter + cycle hub (existing) |
| `suburban-rail-concourse`, `suburban-rail-platform` | Rail interchange |
| `suburban-parking` | Park and ride |
| `suburban-info`, `suburban-lockers` | Wayfinding + parcel pickup |
| `suburban-bus-bay` | Bus bays (`ground-transport` role for `transit-disruption` plan) |

## Part index

See strategy-board groupings in step 3 of `<unit>.twin.yaml` (rural node, rural hub, suburban hub, urban mobility / community / landscape). IndoorGML interchange is optional via the [`indoorgml`](../../../../../packages/spec/doc/pack/bridges.md#indoorgml-ogc-cell-space) bridge.

## Related

- [Mobility hub kit of parts](../../../../../packages/spec/doc/place/mobility/parts.md)
- [Place topology taxonomy](../../../../../packages/spec/doc/place/topology-taxonomy.md)
