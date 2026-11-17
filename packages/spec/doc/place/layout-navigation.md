# Layout navigation (site → floor → room)

How to author and **read** a place so humans and agents get the **whole site in one pass**, then **descend** into floors and rooms without a separate indoor/outdoor stack.

**Scope:** Twinfile supplies the merged spatial graph and optional **visit moments** (`visits[]`). **Runtime movement and user-specific paths are out of scope** — consumers use `spaces`, `openings`, `routes`, role tags, and their own planners.

Normative place layer shape: [Place layers](place.md). Operational roles: [Event roles](../kinds/event-roles.md). Vocabulary: [Visit moments](../glossary.md#visit-moments-visits).

## Problem

Large places (airport, expo campus, hospital) need:

1. **Overview** — regions, exposure across spaces, optional visit moments, where plans pin roles.
2. **Mid scale** — terminals, districts, pavilions, concourses (often **`exposure: covered`** zones).
3. **Fine scale** — floors (`levels`) and rooms/gates/stands (**`exposure: indoor`** or outdoor aprons).

Twinfile keeps **one merged space graph**; navigation is **convention + file order + optional prose**, not a second geometry engine.

## Fast read order (human or AI)

Read in this order before opening every space row:

| Step | File | What you learn |
| --- | --- | --- |
| 1 | `<unit>.twin.yaml` | `layers:` **merge order** (coarse → fine, `bindings/` last), optional `from:` |
| 2 | `place/place.yaml` | `archetype`, `authoring_scale.space_granularity`, site `ext`, name/kind |
| 3 | `docs/layout.md` | Narrative map, region table, id prefixes, which layer files hold detail |
| 3b | `ext/layout-index.yaml` | Machine **region tree** (validated when present) |
| 4 | `place/visits.yaml` | Optional **visit moments** — major zones only |
| 5 | `place/levels.yaml` | **Floor / airside** axis for indoor_stack and multi-level sites |
| 6 | `place/spaces*.yaml` | Start with the **first** spaces layer (usually site/zone grain) |
| 7 | `place/openings.yaml`, `place/routes.yaml` | Connectivity between regions and into interiors |
| 8 | `bindings/*.yaml` | Which space ids matter for each event |

Built built `Place` (after `twin build`) is the single merged truth for tools; the list above is for **authoring and discovery**.

## Resolution tiers (authoring contract)

Declare the default grain on the place, then add finer layers that **patch** the same ids or add new ids.

| Tier | Typical `space_granularity` | Typical `archetype` | Space rows | `level` |
| --- | --- | --- | --- | --- |
| **Site** | `building` or `zone` | `campus` | Districts, terminals, parks, metro | Optional |
| **Zone** | `zone` | `campus` or `indoor_stack` | Concourse, pavilion shell, hall | Often `ground` |
| **Floor** | `zone` or `room` | `indoor_stack` | Per-level concourses, piers | **Required** id from `levels.yaml` |
| **Room** | `room` | `indoor_stack` | Gates, shops, galleries, shelters | **Required** |

**Expo (example):** [`examples/expo`](../../../../catalog/place/examples/expo/) — `archetype: campus`, `space_granularity: zone`, **`visits.yaml`** for tour overview, **`exposure`** on each space; pavilion **interiors** are separate indoor spaces linked by **`openings`**. See [`places/expo/README.md`](../../../../catalog/place/examples/expo/README.md). Generating many CMS pavilion rows onto that campus: [Place recipe — CMS / multi-pavilion](place-recipe.md#cms--multi-pavilion-catalogs-world-expo).

**Airport (example):** [`examples/airport`](../../../../catalog/place/examples/airport/) — today mostly **site-tier** spaces (`terminal-a`, curb, airside); **`levels`** (`ground` / `airside`) foreshadow floor/airside split. Room-tier detail would arrive in **additional place layers** (below), not a new `kind`.

### Expo space kinds

`spaces[].kind` is an open string. Expo / World Expo authoring SHOULD reuse these hints so agents and overlays stay aligned with the golden campus:

| `kind` | Typical `exposure` | Typical `roles` | CMS / map cue |
| --- | --- | --- | --- |
| `district` | `covered` | `alternative` (transit plans) | Thematic precinct / Contentful `district` |
| `pavilion` | `indoor` | `shelter` | Country or thematic pavilion |
| `hall` | `indoor` | `shelter` | Gallery / auditorium inside a pavilion |
| `plaza` | `covered` or `outdoor` | `ground-transport` when it is the arrival hub | Al Wasl–style plaza |
| `park` | `outdoor` | `outdoor` | Jubilee / Al Forsan–style park |
| `stage` | `outdoor` | `outdoor` | Outdoor performance apron |
| `transit` | `covered` | `ground-transport` | Metro / gate arrival |

Ids for CMS-backed rows SHOULD equal the CMS **slug** when it already matches the twin id regex.

## Layer files: coarse first, detail later

List layers in **`<unit>.twin.yaml`** from **overview → detail**. Merge rules ([Layers](../build/layers.md)): RFC 7396 on objects; **spaces with the same `id` deep-merge**; new ids append.

Recommended split (adjust names to your site):

```yaml
layers:
  - place/place.yaml
  - place/levels.yaml
  - place/spaces-site.yaml      # terminals, parks, districts only
  - place/spaces-terminals.yaml # optional: one file per terminal or region
  - place/spaces-rooms.yaml     # gates, rooms, stands (finest grain)
  - place/openings.yaml
  - place/routes.yaml
  - place/visits.yaml
  - place/assets.yaml
```

Optional **authoring split** only (same graph): e.g. `place/spaces-outdoor.yaml` + `place/spaces-indoor.yaml` for editor ergonomics — not a second compose stack.

Use **`from:`** on a child place to reuse a campus **base** and only patch site metadata + extra room layers ([Composition](../build/composition.md)). For interiors maintained as separate twins, nest a building Twinfile under `parts/` and add it with **`copy: ./parts/<name>`** + **`into:`** ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)). Golden compare: [Campus → building → floor](campus-building-floor.md).

## Stable ids (prefix convention)

Space ids MUST match `^[a-z0-9][a-z0-9-]{0,62}$` (no `/`). Use **prefixes** so agents can filter:

| Prefix pattern | Meaning |
| --- | --- |
| `site-*`, `metro-*`, `park-*` | Site / outdoor program |
| `district-*`, `terminal-*` | Zone |
| `ta-l1-*`, `pav-opp-*` | Terminal A level 1; opportunity pavilion interior |

Document prefixes in **`docs/layout.md`**.

## `space.parent` (rollup)

Optional on each **`spaces[]`** row: **`parent`** is another space **`id`** (typically zone → room). `@local-hosting/twinfile-core` checks that the parent exists and that parent links are **acyclic**. Use for BIM/FM rollups and agent tree walks without duplicating geometry.

## `ext/layout-index.yaml` (optional, validated)

Place units MAY ship **`ext/layout-index.yaml`** with top-level key **`layout_index`** (schema [`layout-index.schema.json`](../../schemas/1/ext/layout-index.schema.json)).

| Field | Role |
| --- | --- |
| `regions[]` | Named regions for overview navigation |
| `space_ids` | Space ids in this region (must exist in merged place) |
| `detail_layers` | `twinfile: 2`: collection keys (e.g. `spaces`) that a **`steps:`** item sets. `twinfile: 1`: paths that MUST appear in **`layers:`** |
| `children` | Nested regions (same shape) |
| `granularity` | Hint: `site` \| `zone` \| `floor` \| `room` |

Validated at **`twin check`** (`E_LAYOUT` on bad refs). Does not duplicate coordinates — indexes ids and files only.

Example: [`examples/expo/ext/layout-index.yaml`](../../../../catalog/place/examples/expo/ext/layout-index.yaml).

**CLI:** `twin layout summary [dir]` prints topology, visits, layer space counts, and layout_index regions; **`--json`** for agents.

## `docs/layout.md` (recommended prose)

Allowed under the place unit root (`docs/`). Not validated by schema; optimized for **quick orientation**.

Suggested sections:

1. **One-paragraph site** — fiction disclaimer, timezone, scale.
2. **ASCII or Mermaid diagram** — regions and main flows (outdoor vs covered vs indoor).
3. **Region table** — region name → primary space ids → exposure → layer file.
4. **Floor table** — `level` id → name → which spaces use it.
5. **Drill-down index** — “Terminal A detail → `place/spaces-terminal-a.yaml`”.
6. **Event pins** — which roles/plans touch which regions.

Agents should read this **before** scanning full `spaces.yaml`.

## Machine skim: `visits` + `levels`

- **`visits.yaml`** — optional ordered **visit moments** (`arrival` → major zones → `return`). Layout TOC for agents; not end-user movement.
- **`levels.yaml`** — named floors ordinals; under **`archetype: indoor_stack`**, every space at room tier **must** set `level` (enforced at load).

For **campus** sites, keep **`visits`** at zone/outdoor program grain; add room beats only when the product tour needs them.

## Checklist for a new large place

- [ ] Set **`archetype`** and **`authoring_scale.space_granularity`** on `place`.
- [ ] Add **`docs/layout.md`** with diagram + region/floor tables.
- [ ] Add **`ext/layout-index.yaml`** when agents need a region tree without scanning all spaces
- [ ] Set **`parent`** on room-tier spaces when rollups to zone/building matter
- [ ] Add **`visits.yaml`** for the default overview path.
- [ ] Author **`levels.yaml`** when floors or airside/landside splits matter.
- [ ] Split **`spaces`** layers coarse → fine; use consistent id prefixes.
- [ ] Wire **`openings`** / **`routes`** at the same tier you connect regions (then refine).
- [ ] Keep **event plans** at the **lowest id tier** you need for that scenario (gate-level for surge; zone-level for weather).

## Topology taxonomy

Regions, rollup, passages, and paths are defined in [Place topology taxonomy](topology-taxonomy.md). Read that before wiring **`openings`** / **`routes`**.

## Path query

`openings[].connects` and `routes[].from` / `to` are the graph. `queryPath` walks the merged place: an opening is an edge only when `state` is `open`; a route is an edge in both directions. `length_m` is the sum of the route lengths (an opening adds none). `step_free: true` drops routes whose `kind` is `stair` and any edge with `step_free: false`.

The result is a path (`spaces`, `openings`, `routes`, `length_m`) or the set of spaces reachable from every space tagged with a role such as `shelter`.

Runners read the merged place. They do not carry their own pathfinder. MCP `place.path` returns the same result and the `Place.digest`.

## Related

- [Place layers](place.md) — collections and topology enums
- [Layers](../build/layers.md) — merge and place `from:`
- Example narrative: [`examples/expo/README.md`](../../../../catalog/place/examples/expo/README.md)
