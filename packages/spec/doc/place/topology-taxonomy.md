# Place topology taxonomy

One mental model for **cells (regions)**, **structure**, and **mobility**. Schema collection keys stay stable; **say these words in UI and docs**. When exchanging with [OGC IndoorGML](https://www.ogc.org/standards/indoorgml/), use **cell** in prose and the [`indoorgml` bridge](../pack/bridges.md#indoorgml-ogc-cell-space).

## Three planes (orthogonal)

| Plane | User term | Schema / mechanism | Question it answers |
| --- | --- | --- | --- |
| **Cells** | **Cell** or **region** | `spaces[]` | *What named, non-overlapping zones exist?* (IndoorGML **CellSpace**; terminal, curb, concourse) |
| **Structure** | **Rollup** | `copy:` / `into:`, `space.parent`, `levels[]` | *What contains what for authoring and FM rollups?* |
| **Mobility** | **Transition** (passage) · **State path** | `openings[]` · `routes[]` | *How can someone move between cells?* (IndoorGML dual **State** / **Transition** graph; path query uses only this plane) |

**Rollup does not imply walkable.** A room `parent: terminal-a` is not reachable from the curb until mobility wires that trip.

Path query (`queryPath`, MCP `place.path`) uses **only** passages and paths. Rollup is invisible to routing.

## Mobility: passage vs path

Both are edges between **space ids**. Pick one pattern per adjacency — do not model the same pair twice.

| User term | Schema | Shape | Distance in path query | Typical use |
| --- | --- | --- | --- | --- |
| **Passage** | `openings[]` | `connects: [a, b]` (two ids) | `0` | Door, checkpoint throat, jet-bridge mouth — **threshold** between two regions |
| **Path** | `routes[]` | `from` / `to` | `length_m` | Corridor, sidewalk, apron drive — **travel** along a named segment |

**Decision rule**

1. **Threshold** — person crosses a boundary (indoor/outdoor, landside/airside choke point) → **passage** (`openings`).
2. **Travel** — person walks or is conveyed with meaningful distance outdoors or in a long concourse segment → **path** (`routes`).
3. **`state: closed`** on a passage blocks that edge; paths can be omitted or gated by scenario tracks.

Passages may set `roles: [exit]` for egress and weather plans. Paths set `kind` (`corridor`, `path`, `stair`, …) and `step_free`.

## Structure: rollup

| Mechanism | Role |
| --- | --- |
| **`copy:` + `into:`** | Nest a building/floor twin; prefix ids; default `parent` to the anchor space |
| **`space.parent`** | Optional acyclic tree for rollups (zone → room) |
| **`levels[]`** | Named vertical slices; spaces reference `level` id |

See [Campus → building → floor](campus-building-floor.md). Cross-tier links (site zone ↔ nested room) are **mobility** patches on the site, not automatic from `copy:`.

## Cells (`spaces[]`): space row vocabulary

Each row is one **cell**: a named partition of the site (IndoorGML **CellSpace**). Cells must not overlap; rollup via `parent` is not walkability.

| Field | Role |
| --- | --- |
| `id` / `name` | Stable **cell id** and label (`CellSpace` identity) |
| `kind` | Domain hint (`terminal`, `curb`, `concourse`, `gate` as **zone** kind — not a passage) |
| `exposure` | `indoor` · `outdoor` · `covered` |
| `level` | Floor / airside slice when archetype uses levels |
| `roles` | Hooks for shared **plans** (e.g. `ground-transport`, `shelter`, `exit` on passages too) |
| `parent` | Rollup only |

**Authoring scale** (`space_granularity`: `room` \| `zone` \| `building`) chooses how fine regions are on the map; mobility is wired at the **same tier** you connect regions, then refined inward.

## Airport glossary (aviation → taxonomy)

| Aviation / ops language | Twinfile term | Notes |
| --- | --- | --- |
| Terminal, concourse, apron, curb | **Region** (`spaces`) | Boarding **Gate 12** is usually a region id, not a passage count |
| “Terminal contains concourse” | **Rollup** (`copy`, `parent`) | Containment only |
| Building door, security checkpoint, airside door | **Passage** (`openings`) | Link two region ids; `state: open` \| `closed` |
| Walk from curb to bus area, apron taxi | **Path** (`routes`) | Use `length_m` |
| Airline “route”, slot, hours | *Not topology* | Schedules, scenarios, or out of scope for place graph |
| Jet bridge | **Passage** or **Path** | Threshold plane↔gate lounge → passage; long bridge walk → path |

Golden site: [`examples/airport`](../../../catalog/place/examples/airport/) and [airport layout](../../../catalog/place/examples/airport/docs/layout.md).

## Checklist (author)

- [ ] Name **regions** at the grain the scenario needs (zone vs room).
- [ ] Set **rollup** (`parent` / `copy`) for ownership, not for movement.
- [ ] Add **passages** at building boundaries and choke points.
- [ ] Add **paths** for outdoor or long indoor segments — **not** duplicate passages for the same pair.
- [ ] Tag **roles** on regions and exit passages for shared plans.

## IndoorGML correspondence (informative)

| IndoorGML (OGC) | Twinfile | Notes |
| --- | --- | --- |
| **CellSpace** (primal) | `spaces[]` | Symbolic cell; geometry optional (`ext`, glTF ref, or host map) |
| **CellSpaceBoundary** | (not a row) | Modeled as **Transition** between two cells, not a third space |
| **State** (dual node) | `spaces[].ext.indoorgml.state` | Optional dual-graph id; mobility graph keys off cell `id` |
| **Transition** (threshold) | `openings[]` | `connects: [a,b]` — door, gate, checkpoint |
| **State connection** (travel) | `routes[]` | `from` / `to` + `length_m` — corridor, stair run |
| **Anchor** cell | `spaces[]` with `roles: [anchor]` or `kind: anchor` | Indoor–outdoor or building entrance |
| **Multi-layered space** | `place.ext.indoorgml.layers` | Walkable vs wheelchair, security views, etc. |
| **Inter-layer connection** | `place.ext.indoorgml.interLayerConnections` | Links nodes across layers (e.g. vertical links) |

Import/export: [`twinfile.bridge.indoorgml.v1`](../map/appendix.md#indoorgml-json-profile) via `twin import indoorgml …`. Normative field rules: [`conf/crosswalk.yaml`](../../conf/crosswalk.yaml).

## Composite kits (mobility hubs)

**Mobility hub** and **transit hub** are the same place type in prose: a hub for interchange and waiting. A **campus-shaped** mobility hub uses **`from: twinfile/base-campus`** (outdoor anchors + optional `copy: ./parts/…`); the **kit-of-parts programme** under [`mobility-hub`](../../../catalog/place/examples/mobility-hub/) models tiered nodes without requiring a map pin.

Modular “parts” (shelters, playgrounds, locker walls, **indoor public space**, retail counters) are **child cells**, not child twins. Use `parent` from part → **`programme_zone`** → **`mobility_site`**; set **`exposure`** per part; site context in **`ext.analysis`** / **`ext.design_intent`**. Wire indoor ↔ outdoor with **`openings`**. Pin fixtures on **`assets[]`**. See [mobility-hub kit of parts](mobility/parts.md) and [`examples/mobility-hub`](../../../catalog/place/examples/mobility-hub/).

## Related

- [Layout navigation](layout-navigation.md) — file order, `visits`, path query
- [Place layers](place.md) — archetypes and collections
- [Campus → building → floor](campus-building-floor.md) — nested twins
