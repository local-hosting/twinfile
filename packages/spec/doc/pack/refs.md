# Refs

Short refs: `twinfile/<name>:<tag>` (default registry `ghcr.io/doppler-group/twinfile/<name>:<tag>`). Tags may be full semver (`1.2.0`) or floating OCI tags (`1`, `1.2`) moved on publish.

OCI: `oci:ghcr.io/doppler-group/twinfile/<name>:<tag>@sha256:<digest>` for pinned builds.

JSON Schema: `#/$defs/twinfileRef` in [`defs.json`](../../schemas/1/defs.json).

Relative paths and `github:` refs are allowed inside a unit repo. Published scenarios use **`twinfile: 2`** with **`steps: [{ copy: … }]`** (typed refs recommended: `twinfile/situation/severe-weather:1.0.0`, `twinfile/event/arena-game-day:1.0.0`; flat `twinfile/severe-weather:1.0.0` still resolves — [RFC 0008](../../rfcs/0008-typed-unit-refs/index.md)). Migrate v1 **`include:`** with `twin fmt --upgrade=2`.

## Three hierarchies (do not overload one ref string)

| Axis | Answers | Mechanism |
| --- | --- | --- |
| **Compose** | What stacks on `twin build` | `from:`, `with:`, scenario `steps` `copy:` ([RFC 0001](../../rfcs/0001-five-layers.md), [RFC 0009](../../rfcs/0009-dockerfile-model/index.md)) |
| **Spatial** | Campus → building → floor | Nested Twinfiles copied by `./path` ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)); not published |
| **Catalog** | How units are named and browsed | `kind` on twinfile, `catalog.parent`, `published-refs.json` |

The **ref string** is flat (`twinfile/<name>:<tag>`). **Kind** is always manifest `kind` and OCI config `kind`, not inferred from the slug alone.

## Catalog naming (published `name`)

| `kind` | Pattern | Examples |
| --- | --- | --- |
| `place` (site) | venue slug | `arena`, `transit-hub-campus` |
| `place` (nested stage, unpublished) | `{site}-{part}` | `arena-concourse` (`places/arena/parts/concourse`) |
| `base` | `base-{archetype}` | `base-campus` |
| `mixin` | `mixin-{topic}` | `mixin-severe-weather` |
| `situation` | shared fiction slug | `severe-weather` |
| `event` | `{site}-{story}` | `arena-game-day` |
| `scenario` | `{site}-{question}` | `arena-flood-shelter-standup` |

Runs live at `story/examples/<story>/scenes/<id>/`; the scene id carries the site prefix (e.g. `arena-flood-shelter-standup`).

## `catalog.parent`

Scenario and event units MAY set:

```yaml
catalog:
  parent: twinfile/arena:1.2.0
```

`parent` is the **host place ref** for indexes and MCP; compose uses `from:` and scenario **`steps` `copy:`**.

Golden inventory: [`published-refs.json`](../../../../catalog/place/examples/published-refs.json) (`refs` plus generated `catalog.byKind`).

## Renamed published units (2026-11)

Site-tied events and scenarios use `{site}-` prefixes. Update pins and scenario **`steps`** refs:

| Former ref | Current ref |
| --- | --- |
| `twinfile/game-day:1.0.0` | `twinfile/arena-game-day:1.0.0` |
| `twinfile/storm-at-halftime:1.0.0` | `twinfile/arena-storm-at-halftime:1.0.0` |
| `twinfile/flood-shelter-standup:1.0.0` | `twinfile/arena-flood-shelter-standup:1.0.0` |
| `twinfile/terminal-surge:1.0.0` | `twinfile/airport-terminal-surge:1.0.0` |
| `twinfile/hub-queue-spill:1.0.0` | `twinfile/transit-hub-campus-hub-queue-spill:1.0.0` |
| `twinfile/shelter-at-cap:1.0.0` | `twinfile/shop-shelter-at-cap:1.0.0` |
| `twinfile/outdoor-shelter-cap:1.0.0` | `twinfile/expo-outdoor-shelter-cap:1.0.0` |

Scenario timetable keys that referenced event unit names must use the new prefix (e.g. `arena-game-day.halftime`).

## Typed refs (optional, RFC 0008)

```text
twinfile/scenario/arena-storm-at-halftime:1.0.0
twinfile/place/arena:1.2.0
```

Flat refs remain valid. Typed and flat forms MUST resolve to the same digest when name, tag, and tree match. See [RFC 0008](../../rfcs/0008-typed-unit-refs/index.md).

## Downstream mounts (hosts)

Host experience models reference place layout with **`placeRef`** (`twinfile/shop:1.2.0` or pinned `oci:…`). Hosts resolve catalogs, embed **`placeMount`** on packs, and bind scenes with **`venueKey`**. See [Archived venue → place migration](../migration/venue-to-place.md) for hand-porting archived venue YAML.

Runners: `npm:` refs only in `use.runner`. `use.runners[]` lists further `npm:` refs when the entrypoint is `npm:@twinfile/runner-compose@^0` (see [Runners](runners.md#several-runners-one-clock)).
