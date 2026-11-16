# Campus → building → floor (pattern cheat sheet)

A campus is a stack of building cards. Each building is its own Twinfile nested under the campus's `parts/` directory, and each floor is its own Twinfile nested under its building's `floors/` directory. A parent copies a child in with one `copy: ./…` instruction in `steps:`. There is no separate `subspaces` collection.

Normative rules: [RFC 0009](../../rfcs/0009-dockerfile-model/index.md). Navigation prose: [Layout navigation](layout-navigation.md).

## Quick pick

| You need | Pattern | Golden example |
| --- | --- | --- |
| One building interior, site stays mostly outdoors/zones | **One `copy: ./parts/<name>`** with `into:` | [`mobility-hub/campus`](../../../../catalog/place/examples/mobility-hub/campus/) |
| Same building + a **second vertical slice** (landside vs airside) as its own Twinfile | **Building that copies `./floors/<floor>`** | [`airport`](../../../../catalog/place/examples/airport/) |
| Room detail only inside one site file | **More patches** after site spaces (no nested unit yet) | Airport [`layout.md`](../../../../catalog/place/examples/airport/docs/layout.md) “Drill-down” |
| Arbitrary containment tree in one unit | **`spaces[].parent`** (acyclic) | Spec [layout-navigation](layout-navigation.md#spaceparent-rollup) |

## Pattern A — one building (`mobility-hub/campus`)

**When:** Campus map shows a hub plus quads/roads; **one** indoor stack twin holds concourse/ticket-hall detail.

```
mobility-hub/campus/campus.twin.yaml
mobility-hub/campus/parts/transit-hub/transit-hub.twin.yaml
```

**Site manifest**

```yaml
from: twinfile/base-campus:0.1.0
twinfile: 2
steps:
  - spaces:
      - id: transit-hub
        kind: transit
  # …
  - copy: ./parts/transit-hub
    into: transit-hub
```

**Rules**

1. An earlier site patch MUST declare the `into:` anchor (`transit-hub`).
2. The building uses `from: twinfile/base-indoor-stack` and its own `spaces:` patch (room-tier ids like `ticket-hall`).
3. Copy builds the building, strips its `place` metadata and `levels`, prefixes its ids (default `<into>-`, e.g. `transit-hub-ticket-hall`), and parents unparented rows to the anchor.
4. The site owns **`levels`**; building spaces use level ids from the site (e.g. `ground`).

**Pros:** One instruction; the building is a normal Twinfile you can build alone.
**Cons:** No separate slice for “airside only” without a floor or more site patches.

## Pattern B — building + floor (`airport`)

**When:** Site needs **site-tier** zones (curb, apron) **and** a building interior **and** an extra slice (airside) maintained as its own Twinfile.

```
places/airport/airport.twin.yaml
places/airport/parts/terminal-a/terminal-a.twin.yaml
places/airport/parts/terminal-a/floors/airside/airside.twin.yaml
```

**Building manifest** (copies its floor):

```yaml
from: twinfile/base-indoor-stack:0.1.0
twinfile: 2
steps:
  - spaces: [ … concourse, security-hall … ]
  - copy: ./floors/airside
    prefix: airside-
```

**Site manifest** (copies the building):

```yaml
from: twinfile/base-campus:0.1.0
twinfile: 2
steps:
  # … site place, levels, spaces (terminal-a, curb, apron) …
  - copy: ./parts/terminal-a
    into: terminal-a
```

**Rules**

1. Anchor space `terminal-a` on the site; landside/airside **site** spaces use `level` from the site `levels` (`ground`, `airside`).
2. The floor's rows carry their own `level: airside`; copy never adds levels.
3. Prefixes compose: the floor's `hold-room` becomes `airside-hold-room` in the building, then `terminal-a-airside-hold-room` on the site, parented to `terminal-a`.
4. Plans on the site still bind **roles** to merged ids; pin roles at the tier you simulate (zone vs gate).

**Pros:** Each slice is its own Twinfile with its own patches.
**Cons:** Prefix discipline (`terminal-a-*`); cross-unit passages (`openings:`) are still manual site patches.

## Side-by-side

| | Mobility hub campus | Airport |
| --- | --- | --- |
| **Archetype** | `campus` | `campus` |
| **Site spaces** | `transit-hub`, `quad`, `shuttle-loop` | `terminal-a`, curb, bus gates, remote stand |
| **Copies** | 1 building | 1 building, which copies 1 floor |
| **Nested bases** | `base-indoor-stack` | `base-indoor-stack` (building and floor) |
| **Site `levels`** | yes | yes (`ground`, `airside`) |
| **Typical scenario** | `mobility-hub/campus-hub-queue-spill` | `airport-terminal-surge` |

## Authoring checklist

1. **`twin init place … --geotype <slug>`** — campus slugs get `base-campus`, optional **`PARTS.md`** ([`examples/PARTS.md`](../../../../catalog/place/examples/PARTS.md)), and `suggest_building_import` from geotypes.
2. **Site first** — anchor building space id, outdoor/covered zones, `levels` if more than one slice matters on the map.
3. **`twin init place parts/<name> --geotype …`** for each building, then `twin fmt --upgrade=2 --recursive`.
4. **Copy** — append `copy: ./parts/<name>` with `into: <anchor>` after the patch that declares the anchor. Floors: the building appends `copy: ./floors/<floor>` with a `prefix:`.
5. **Plans** — map event roles to ids at the **lowest tier** needed for the story (zone for weather; gate for surge).
6. **`twin build` / `twin check --strict`** — `no space "<id>" to copy into` means the anchor is missing or typo’d.

## Pattern C — single building (`copy:`)

One `copy: ./parts/<name>` with `into:` when the interior is large or reused. Small interiors can stay on the site twin (extra `spaces:` step) — see [`expo`](../../../../catalog/place/examples/expo/) and [`port`](../../../../catalog/place/examples/port/).

| Site | `into:` anchor | Nested building |
| --- | --- | --- |
| [`arena`](../../../../catalog/place/examples/arena/) | `concourse` | `parts/concourse` |

[`park`](../../../../catalog/place/examples/park/) is **`open_area`**: no buildings, outdoor-only fiction.

## Ids after copy (prefix + provenance)

| Field | Default |
| --- | --- |
| `prefix` with `into:` | `"<into>-"` (e.g. `transit-hub-ticket-hall`) |
| `prefix` without `into:` | none unless set |
| `parent` on copied rows | `into` for rows with no `parent`; a `parent` pointing at another copied row gets the prefix |

Provenance refs are `copy/<into or name>/…` in the build layer list (`twin layers`).

**Plans and roles:** bind event roles to **merged** ids in `plan:` items. Scenario tests may target site-tier ids only (weather on zones) or prefixed room ids (surge at gates) — pick the tier the story needs ([layout-navigation](layout-navigation.md)).

## Host tools (map, patch UI, modules)

After `twin build`, treat hierarchy as **data on `Place.data.spaces[]`**, not a separate subspace file:

| Need | Read |
| --- | --- |
| Site vs room address | Space `id` (prefixed after copy); optional `parent` chain |
| Floor slice | `spaces[].level` + site `levels[]` |
| Which unit authored a row | `twin layers` → `copy/` refs |
| Map zoom / drill-down | Site anchors first (`terminal-a`, `transit-hub`); expand to prefixed children |

Port types like `ref:space` in a patch UI should accept **any** merged id; optional UI metadata can derive **tier** from `authoring_scale.space_granularity`, `parent` depth, and id prefix.

## CLI walkthrough

```bash
# From examples/ (or your site tree)
twin build mobility-hub/campus
twin layers mobility-hub/campus   # copy/transit-hub/… provenance
twin build places/airport               # building + floor copies
twin check --strict places/airport
```

A nested building builds alone (`twin build places/airport/parts/terminal-a`), but it is a build stage: never published, no `twinfile/` ref.
