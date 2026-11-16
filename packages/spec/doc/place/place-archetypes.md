# Place bases (layout classification)

In prose, call this a **base** — the layout image a site inherits with **`from:`** (Docker-style). Geotypes and manifests use the field name **`archetype`** (`campus`, `open_area`, …) for the same five kinds. Classify on **three axes** first; the base kind is a **lookup**, not a judgment call. Examples vocabulary: [`examples/README.md`](../../../../catalog/place/examples/README.md#vocabulary-one-word-per-layer). Field definitions: [Place layers](place.md#place-archetype).

## The three axes

### 1 — Extent (map-first)

What public maps (OpenStreetMap, Google Maps, Apple Maps) show **first**.

| Value | Map surface | Typical geometry |
| --- | --- | --- |
| **`footprint`** | One pin or one building outline | Point / single building polygon |
| **`site`** | One labeled boundary containing several buildings or areas | Polygon with child features |
| **`area`** | Open land, no buildings that matter to the twin | Polygon, no child buildings |
| **`route`** | One line or path | LineString |

### 2 — Vertical

| Value | Meaning |
| --- | --- |
| **`flat`** | One walkable plane (ground) |
| **`stacked`** | Floors the map does not show |

### 3 — Movement

| Value | Meaning |
| --- | --- |
| **`free`** | Spaces form a graph; any order (`openings` / adjacency define reachability) |
| **`sequenced`** | Spaces have a canonical order |

Indoor / outdoor / covered is **not** an axis — it stays **`spaces[].exposure`** per space.

## Axes → archetype

| Extent | Vertical | Movement | Archetype | Golden base | Examples |
| --- | --- | --- | --- | --- | --- |
| footprint | flat | free | `single_level` | `twinfile/base-single-level:0.1.0` | shop, cafe, bus stop |
| footprint | stacked | free | `indoor_stack` | `twinfile/base-indoor-stack:0.1.0` | tower, hotel, apartment building |
| site | flat or stacked | free | `campus` | `twinfile/base-campus:0.1.0` | university, airport, hospital |
| area | flat | free | `open_area` | `twinfile/base-open-area:0.1.0` | park, field, campground, farm |
| route | flat | sequenced | `linear` | `twinfile/base-linear:0.1.0` | trail, creek reach, pipeline, rail yard |

Combinations not listed (e.g. `route` + `stacked`, `footprint` + `sequenced`) are **invalid**; tools MUST reject them rather than guess. The table is exported as **`PLACE_ARCHETYPE_AXES`** from `@doppler-group/geotypes`; **`archetypeForAxes`** performs the lookup.

A **site with floored buildings** (airport, hospital, mall property) is `campus`: `level` is optional across the site, so floored buildings set `level` on their spaces and grounds do not.

## Resolution in `@doppler-group/geotypes`

`yarn sync:place-archetypes` materializes **`extent`**, **`vertical`**, **`movement`**, and **`archetype`** on every registry slug. Each axis resolves independently:

| Axis | Order |
| --- | --- |
| extent | slug override → geometry (`point` → footprint, `linestring` → route, `polygon` → category **`extent`**) |
| vertical | slug override → category **`vertical`** (footprint / site only) → `flat` |
| movement | slug override → `sequenced` when extent is `route`, else `free` |

Sources: category roots in `data/category/*.yml` set **`extent`** (`footprint` · `site` · `area`, applied to polygons) and optional **`vertical`**; `data/place-archetype-rules.yml` → **`slugs:`** overrides **one axis at a time** (e.g. `hotel: { vertical: stacked }`). Unsupported geometry fails the sync. Look up a slug with **`placeAxesForSlug`** / **`placeScaffoldForSlug`**.

### Assets are not places

A registry slug for a **point asset with no interior** (stop sign, traffic light, fire hydrant, utility pole, meter, valve, well, tower, ATM) is **not a place**. Each one is listed under **`assets:`** in `place-archetype-rules.yml`. Asset slugs stay in the geotypes registry (`GEOTYPE_SLUGS`, crosswalks), but:

- They get no axes, archetype, or decorations, and they are absent from `GEOTYPE_LAYOUT_META_BY_SLUG`. They are listed in **`GEOTYPE_ASSET_SLUGS`** and checked with **`isAssetGeotype`**.
- `twin init place --geotype <asset>` MUST fail. Model the asset as a row in the containing place's **`assets.yaml`** layer instead (e.g. a hydrant on a `public_park` place).
- An asset slug MUST NOT also have a `slugs:` override; the sync fails if it does.

Point geometry alone does not make a slug an asset: shops, cafes, and banks are mapped as points but have interior spaces, so they stay `single_level` places.

### Venues and resources

Every registry slug is a **venue** or a **resource**. A venue is a place a person can be in, at, or travel along (shop, house, airport, highway, creek). A resource is equipment or conveyance fixed on the map (`stop_sign`, `underground_cable`, `gas_pipeline`). Point assets are resources. A moving dot (person, agent, robotic car) is an actor, not a geotype.

The catalogs are `data/venue/features.yml` and `data/resource/features.yml` in `@doppler-group/geotypes`. `geotypeKindForSlug` reads the divide.

## Decorations

Each slug also materializes suggested decorators ([Decorate a twin](decorate-twin.md#geotype-decorations)):

| Field | Resolution |
| --- | --- |
| **`situations`** | slug override (replaces) → category **`situations`** → none. Must be listed in `place-archetype-rules.yml` → **`situations:`** |
| **`layers`** | `archetype_layers[archetype]` ∪ category **`layers`** ∪ slug **`layers`**, in canonical order (`levels` → `spaces` → `openings` → `markers` → `stations` → `gauges` → `sensors` → `routes` → `visits` → `assets`) |
| **`suggest_building_import`** | `suggest_building_import[archetype]` in `place-archetype-rules.yml` (today **`campus: true`**). Materialized per slug; `suggestBuildingImportForSlug` drives init **`place/BUILDINGS.md`** |

Defaults: occupied places get **`severe-weather`**; transport categories and large venues add **`transit-disruption`**; waterways add **`dam-release`**; parks, waterfronts, and conservation land add **`litter-pollution`**; utilities infrastructure adds **`power-outage`**; natural resources get none. Public-facing categories add **`assets`**; infrastructure and natural-resource categories add **`sensors`**.

## Validation per axis

When `place.archetype` is set, `@doppler-group/twinfile-core` checks the archetype's axes at load time:

| Axis value | Load-time rule |
| --- | --- |
| vertical `stacked` | Every space sets **`level`** |
| vertical `flat` | At most one row in **`levels.yaml`** |
| movement `sequenced` | Every space sets **`visit_order`** (integer ≥ 0) |
| extent `site` / `area` | Place sets **`footprint`** or **`ext`** lat/lon |

`campus` allows either vertical, so neither level rule applies unless the place declares one with **`axes:`**.

## Declared axes and mixins

A place MAY declare **`axes:`** on its manifest and add golden **`with:`** mixins ([RFC 0004](../../rfcs/0004-composed-bases.md)). The resolved axes overlay the inherited archetype's axes in compose order (`from:` chain → `with:` mixins → the place). The archetype is derived from them, and the rules above run on the **resolved** axes. A campus with `axes: { vertical: stacked }` therefore requires `level` on every space.

Golden mixin spaces sit on level **`ground`** and carry a **`visit_order`**, so they pass stacked and sequenced bases. Every golden base names its ground level `ground`.

## Building and floor imports

Campus places MAY nest **`indoor_stack`** (or other) building Twinfiles under `parts/` and copy each one under a site anchor space with `copy: ./parts/<name>` and `into:`; a building may copy its own `floors/` the same way ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)). Catalog: [`examples/README.md`](../../../../catalog/place/examples/README.md#campus-buildings-rfc-0009) (airport, transit-hub, expo, arena, port). Patterns: [Campus → building → floor](campus-building-floor.md).
