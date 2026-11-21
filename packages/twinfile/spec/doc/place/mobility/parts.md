# Mobility hub kit of parts (authoring)

**Kit of parts is not a bridge.** Describe modular hubs with native place layers in one **`<unit>.twin.yaml`** (`steps:`).

## Strategy board → Twinfile (planner / architect language)

| Board column | Twinfile | Vocabulary |
| --- | --- | --- |
| **Analysis** | `ext.analysis` on **`mobility_site`** cells | `urban_context`, `density`, `land_use[]`, `trip_purpose[]`, `modes[]`, optional `car_dependence` |
| **Objectives** | `ext.design_intent[]` on the same site | Performance goals: `dwell_quality`, `transit_integration`, `public_realm`, … |
| **Interchange scale** | `ext.typology` | `node` · `hub` |
| **Program structure** | `kind: programme_zone`, `ext.programme` | `mobility` · `community` · `landscape` |
| **Building twin** | `copy: ./parts/<name>` + `into:` anchor | Community pavilion interior: [`parts/urban-services-building`](../../../../src/catalog/place/examples/mobility-hub/programme/parts/urban-services-building/) (`from: base-indoor-stack`); ids import as `urban-services-building-*` |
| **Elements** | Child **`spaces[]`** rows | `kind` + **`exposure`** (enclosure) + optional `ext.use`, `ext.module.footprint_m` |
| **Equipment (resources)** | **`assets[]`** with `space:` | Physical fixtures: chargers, displays, lockers — inventory the twin can count or set `state` on |
| **Services** | **`services[]`** with `space:` + `kind` | Capabilities offered **at** a cell (bike parking, charging, waiting/shelter) — see [`mob-hub-services.yaml`](../../../conf/mob-hub-services.yaml) |

A **space** is the cell; **services** are what it offers travellers; **assets** are concrete equipment backing those services (when modeled). Example: `urban-ev-charging` cell carries `kind: charging` in **`services[]`**; `urban-charger-a` is an **`assets[]`** row with `space: urban-ev-charging`.

**Indoor / outdoor / covered** is **`exposure`** on each cell. Thresholds between cells: **`openings`**; travel distance: **`routes`**.

**Geography:** WGS84 coordinates belong **only** on the root **`place`** record (`place.ext.lat` / `lon`, optional **`h3`** for the demo map pin). Golden open-area site: [`examples/park`](../../../../src/catalog/place/examples/park/park.twin.yaml) (`from: twinfile/base-open-area`). Site **`ext.analysis`** is qualitative only. **`ext.module.footprint_m`** is module size in metres, not map geometry.

Golden **programme:** [`examples/mobility-hub/programme/programme.twin.yaml`](../../../../src/catalog/place/examples/mobility-hub/programme/programme.twin.yaml). **Instance** with demo map pin: [`examples/mobility-hub/mobility-hub.twin.yaml`](../../../../src/catalog/place/examples/mobility-hub/mobility-hub.twin.yaml) (`from:` programme, patch `place.ext` only).

## IndoorGML

Outdoor and indoor program cells use [topology-taxonomy](../topology-taxonomy.md). OGC **CellSpace** exchange: bridge id **`indoorgml`** — not a kit import format.
