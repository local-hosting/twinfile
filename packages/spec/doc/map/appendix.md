# Appendix (non-normative)

External mappings into the native document, which stays **`place/*.yaml`** (and a JSON Lines feed for observations). An importer writes that YAML. An exporter reads a built `Place`. Known terms and where they land are listed in [`conf/crosswalk.yaml`](../../conf/crosswalk.yaml). A term in that file is written only to the named field. A term marked `ext`, or absent from the file, goes in **`ext`**.

Place identity stays a geotype slug. An IMDF venue `category` sets `geotype.primary` when that slug's `mappings.imdf` matches (`museum`). A GTFS line uses `mappings.gtfs: station`, which resolves to `train_station`. Room-level categories stay `spaces.kind`. Event roles stay the role list; the crosswalk only tags a role that is already on that list (`egress` → `exit`).

Fixtures: [`conf/map/`](../../conf/map/).

## IMDF

| IMDF | Twinfile |
| --- | --- |
| venue | `place` (`name`, `category` → `kind`, `timezone`, `address`) |
| level | `levels` (`ordinal`, `name`) |
| unit | `spaces` (`category` → `kind`, `level_id` → `level`) |
| opening | `openings` (`category` → `kind`, `unit_ids` → `connects`, `width` → `width_m`). `category: egress` adds role `exit` |

`hours`, `restriction`, `outdoor`, and `door` have no columns; the [venue fixture](../../conf/map/imdf-venue.json) keeps them on `ext`.

## GTFS

| GTFS | Twinfile |
| --- | --- |
| stop | a `spaces` row with `visit_order`. `location_type` `1` is also a `stations` row |
| `stop_lat` / `stop_lon` on a station | `stations[].location` `{lat, lng}` |
| `pathways.txt` `pathway_mode` | `routes.kind` (`walkway` → `corridor`, `stairs` → `stair`, `escalator`, `moving_sidewalk`, `elevator`). `length` → `length_m` |
| shape that is one line | `archetype: linear` |

`zone_id` has no column. The [stop fixture](../../conf/map/gtfs/stops.txt) puts it in `stations[].ext`. Walk edges are [pathways.txt](../../conf/map/gtfs/pathways.txt). The matching shape is [shapes.txt](../../conf/map/gtfs/shapes.txt). Fare gates and exit gates stay openings, not route kinds.

## Brick

| Brick | Twinfile |
| --- | --- |
| point whose type is a sensor | `sensors`, with the type IRI on `brick` |
| any other point | `assets` (`kind` is the local name slug, `brick` is the type IRI) |

`timeseries` and `vendor` have no columns. The [point fixture](../../conf/map/brick-point.json) keeps them on `ext`.

## BOT

| BOT | Twinfile |
| --- | --- |
| storey | `levels` (`level` → `ordinal`) |
| space | `spaces` (`storey` → `level`) |

`usage` has no column. The [storey fixture](../../conf/map/bot-storey.json) keeps it on `spaces[].ext`.

## SOSA

| SOSA | Twinfile |
| --- | --- |
| `madeBySensor` | `device_id` |
| `hasFeatureOfInterest` | `observes` (the space or gauge the sensor watches) |
| `phenomenonTime` | `observed_at` |
| `resultTime` | `available_at` |

`wasAttributedTo` has no feed column. The [observation fixture](../../conf/map/sosa-observation.json) keeps it on `ext`. NGSI-LD `observedAt` and `dateModified` use the same two times.

## glTF / GLB (geometry bridge)

The built-in glTF bridge does **not** parse mesh graphs. Import input is JSON:

| Field | Twinfile |
| --- | --- |
| `path` or `file` | `sources/` relative path in the scaffold |
| `node` | suffix on `spaces[].geometry.ref` (`<path>#<node>`) |
| `name` | `place.name` and default space label |

Other fields stay on `spaces[].ext`. Export is undefined; viewers read `geometry.ref` from a built `Place`.

## IndoorGML (JSON profile)

OGC [IndoorGML](https://www.ogc.org/standards/indoorgml/) separates **primal** layout (**CellSpace**) from the **dual** navigability graph (**State** / **Transition**). Twinfile keeps the same split: **cells** are `spaces[]`; threshold **transitions** are `openings[]`; travelled **state paths** are `routes[]`.

The built-in accepts **`twinfile.bridge.indoorgml.v1`** JSON (not raw GML XML yet). Import / export:

| IndoorGML (profile) | Twinfile |
| --- | --- |
| `cellSpaces[]` (`class`, `level`, `parent`, `state`, `layer`) | `spaces[]` (`kind` from `class`, `level`, `parent`, `roles` includes `anchor` when `class: Anchor`) |
| `levels[]` | `levels[]` |
| `transitions[]` with `connects[2]` | `openings[]` (dual **Transition** at a threshold) |
| `statePaths[]` / route-like `transitions` with `from`, `to`, `length_m` | `routes[]` (**State**-to-**State** travel) |
| `layers[]`, `interLayerConnections[]` | `place.ext.indoorgml` (multi-layered space model) |
| `cellSpaces[].state` | `spaces[].ext.indoorgml.state` (dual graph node id) |

Fixture: [`conf/map/indoorgml-building.json`](../../conf/map/indoorgml-building.json). Vocabulary: [Place topology — IndoorGML](../place/topology-taxonomy.md#indoorgml-correspondence-informative).

## IFC (projection stub)

The **`ifc`** built-in (`@doppler-group/twinfile-bridge`) accepts **`.ifc` STEP** (via `web-ifc`: `IfcBuildingStorey` → `levels`, `IfcSpace` → `spaces`) or **JSON projection** ([fixture](../../conf/map/ifc-building.json)):

| Field | Twinfile |
| --- | --- |
| `name` | `place.name` |
| `file` | `place.ext.ifc_file` (path under `sources/`) |
| `storeys[]` | `levels` (`level` → `ordinal`) |
| `spaces[]` | `spaces` (`storey` → `level`, `ifcType` → `kind`) |

`usage` and other properties stay on `spaces[].ext`. Full IFC → assets/MEP is a future bridge version ([RFC 0006](../../rfcs/0006-bridge-plugins.md)).
