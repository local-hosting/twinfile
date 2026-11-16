# Place layers (`place/`)

Author the twin under **`place/`** — one top-level collection key per YAML file (`spaces`, `openings`, `tracks`, …). IDs MUST match `^[a-z0-9][a-z0-9-]{0,62}$`.

**`twin build`** merges those files (and **`from:`** bases) into **`Place.data`**. The site record is **`Place.data.place`** (name, timezone, archetype, …).

Geometry uses **`geometry.ref`**: `sources/<path>#<feature-id>`. Builds MUST NOT require geometry.

## Place archetype

Optional on **`place/place.yaml`** → `place.archetype` (venue YAML before Twinfile-1 used `layout.mode`; see [migration](../migration/venue-to-place.md)).

**Pick the archetype from what typical public maps show first** (OpenStreetMap, Google Maps, Apple Maps)—not from whether the real site also has outdoor space. Indoor, covered, and outdoor program is modeled with **`exposure`** on spaces and optional **`openings`**, not by switching archetype for every indoor/outdoor combination.

Each archetype is a named combination of three axes — **extent**, **vertical**, **movement** — defined in [Place archetypes](place-archetypes.md).

**Dockerfile-style recipe:** [Place recipe](place-recipe.md) (`from:` → **`archetype`** → **`layers:`** → per-space **`exposure`**). **Mix pre-defined bases, events, and asset layers:** [Decorate a twin](decorate-twin.md). **Campus site + building + floor imports:** [Campus → building → floor](campus-building-floor.md).

| Map surface | Archetype | Authoring rule |
| --- | --- | --- |
| **One pin or building footprint** (shop, cafe, office suite) | `single_level` | At most one row in **`levels.yaml`** when levels are authored. |
| **One map pin**, but the twin must stack **floors** maps do not show (tower, mall interior nav) | `indoor_stack` | Every space MUST set **`level`**. Outdoor/covered plazas at **`level: ground`** are fine. |
| **Several areas or buildings** on one labeled site (university, airport, mall property) | `campus` | **`level`** optional; site needs **`footprint`** or **`ext` lat/lon**. |
| **Open land** with no buildings that matter (park, field, farm, campground) | `open_area` | At most one level; site needs **`footprint`** or **`ext` lat/lon**. |
| A **line or path** (trail, creek reach, corridor, pipe, rail yard) | `linear` | Each space MUST set **`visit_order`**. |

`@local-hosting/geotypes` suggests an archetype per slug using map-first rules (materialized as **`extent`**, **`vertical`**, **`movement`**, and **`archetype`** on each registry slug at sync). Override in **`place.yaml`** when your twin deliberately models a finer grain than the map. **`shopping_mall`** and **`examples/shop`** both scaffold **`indoor_stack`** with **`from: twinfile/base-indoor-stack`**; the shop adds stacked **`layers:`** for spaces, routes, and event plans — see [Composition](../build/composition.md).

Optional **`place.authoring_scale`**: `linear_unit` (`m` \| `ft`), `h3_resolution`, `space_granularity` (`room` \| `zone` \| `building`).

Each **`spaces[]`** row MAY set **`parent`** to another space id for hierarchical rollup (validated at load). **Regions, rollup, and mobility** use one vocabulary — [Place topology taxonomy](topology-taxonomy.md). See [Layout navigation](layout-navigation.md).

When `archetype` is set, `@local-hosting/twinfile-core` enforces matching rules at load time.

## Visit moments (`visits[]`)

Optional **`visits.yaml`** or a v2 **`steps:`** item → **`visits[]`**: **visit moments** bound to `space` ids (layout TOC; pre–Twinfile-1 venue YAML used `moments.yml` — [migration](../migration/venue-to-place.md)). Runtime movement and persona routing are **host-owned** ([glossary](../glossary.md#visit-moments-visits)).

| Field | Role |
| --- | --- |
| `id` | Stable beat id (story `visitMomentId`). |
| `kind` | `arrival`, `entry`, `waiting`, `activity`, `exit`, `return` |
| `space` | Primary space for the moment |
| `order` | Sort key (0 = first) |
| `during` | Optional schedule id: moment is active on the timeline while that schedule is active (after `activeWhen` gates) |

## Time

**`tracks.yaml`** and **`schedules.yaml`** describe what changes over a scenario's clock. See [Time](time.md).

Unknown files belong under **`ext/`**.

Schemas: [`schemas/1/place/`](../../schemas/1/place/).
