# Expo City Dubai

Illustrative tri-petal campus pinned at **Expo City Dubai** (central plaza, three thematic districts with anchor pavilions, major parks, metro arrival). Topology is fiction, not a claim about the real site plan.

## Indoor / outdoor strategy

Twinfile uses **one space graph**; indoor vs outdoor is not a separate zone layer.

| Layer in the real site | Twinfile modeling |
| --- | --- |
| Shaded district concourses and plaza trellis | `exposure: covered` spaces at **zone** granularity (`authoring_scale.space_granularity: zone`) |
| Pavilion galleries and host building | `exposure: indoor` spaces; **`roles: [shelter]`** for heat/storm plans |
| Parks, lawns, outdoor stages | `exposure: outdoor` spaces; **`roles: [outdoor]`** for plan buckets |
| Metro / portal arrival | `exposure: covered` + **`ground-transport`** role |

**Place topology:** `archetype: campus` with site `ext` lat/lon (outdoor-scale site, optional `level` per space).

**Movement:**

- **`routes`** — concourse and park **`path`** edges outdoors; short **`corridor`** edges into pavilion thresholds.
- **`openings`** — doors between each district concourse and its pavilion; gates between plaza, metro, and parks (mark **`exit`** where egress matters for events).

**Virtual visit path:** the `visits:` patch mirrors a digital expo tour: arrival → plaza → three pavilion beats → outdoor park → return.

**Events:** `severe-weather` closes or restricts outdoor program spaces while shelter roles stay on pavilion interiors; `transit-disruption` closes metro arrival and steers flow to district concourses.

**Layout map (site → room):** [`docs/layout.md`](docs/layout.md) · machine index [`ext/layout-index.yaml`](ext/layout-index.yaml) · `twin layout summary expo`

## Runs

**Daily:** [`expo-operations`](../../../story/examples/expo-operations/expo-operations.twin.yaml) — pavilion arrival and visitor surge (`mode: daily`).

**Resilience:** [`expo-resilience`](../../../story/examples/expo-resilience/expo-resilience.twin.yaml) — outdoor shelter capacity (`mode: resilience`).
