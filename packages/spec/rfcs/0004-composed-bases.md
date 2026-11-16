# RFC 0004 — composed bases (`axes:` and `with:` mixins)

## Summary

Let a place declare its archetype axes (`axes:`) and add shared decorations as a list of mixins (`with:`), instead of picking one golden base and copying stubs and plans into the unit. A Dockerfile has one `FROM` but many `COPY --from=` stages; a Twinfile keeps one `from:` and gains an ordered `with:` list.

Status: Accepted (implemented in `@local-hosting/twinfile-core`)
Created: 2026-11-06

## Motivation

[Place archetypes](../doc/place/place-archetypes.md) splits every place into three axes (extent, vertical, movement) and suggests decorations per geotype (events and layer kits). Today a unit can only inherit one `from:` base, so:

- **Combinations need a base each.** A stacked hospital building on a campus with river sensors and litter markers is `base-campus` plus hand-copied layers. Covering every archetype × event × layer kit with golden bases grows multiplicatively.
- **Decorations are copied, not referenced.** `twin init place --geotype` writes role-tagged stubs and plans into the child. When the shared hooks for `dam-release` improve, existing places do not pick up the change.
- **Axes are implicit.** `place.archetype` names the result, but nothing records which axis made a place `campus` rather than `indoor_stack`, so reviewers cannot see what changed when a base is swapped.

**Since RFC 0004 shipped:** **`with:`** addresses copied decorations (shared mixin units). Campus sites with separate interior twins nest building and floor Twinfiles and add them with **`copy: ./buildings/<name>`** ([RFC 0009](0009-dockerfile-model/index.md), which superseded RFC 0005's `buildings:` / `floors:`). This RFC remains the norm for **mixin composition** and optional **`axes:`**; cross-unit building import is specified in RFC 0005.

## Specification

### `axes:` on a place manifest

```yaml
twinfile: 1
kind: place
name: river-hospital
from: twinfile/base-campus:0.1.0
axes:
  vertical: stacked
with:
  - twinfile/mixin-severe-weather:0.1.0
  - twinfile/mixin-dam-release:0.1.0
  - twinfile/mixin-sensors:0.1.0
layers:
  - place/place.yaml
  - place/spaces.yaml
```

- **`axes:`** is optional. Keys are `extent`, `vertical`, and `movement`, with the values from [Place archetypes](../doc/place/place-archetypes.md#axes). Omitted keys inherit from the composed base.
- The **resolved axes** are computed in compose order: the `from:` chain, then each `with:` entry, then the child's own `axes:`.
- The **archetype** is `archetypeForAxes(resolved axes)`. If `place.archetype` is also set, it MUST equal the derived value (`E_ARCHETYPE_AXES_MISMATCH`). Invalid combinations fail as they do today.
- Load-time axis rules ([Validation per axis](../doc/place/place-archetypes.md#validation-per-axis)) run on the resolved axes.

### Mixin units

A mixin is a unit with `kind: mixin`. It carries layers and plans but is not a place by itself.

```yaml
twinfile: 1
kind: mixin
name: mixin-dam-release
version: 0.1.0
applies_to:
  extent: [route, area, site]
provides:
  events: [dam-release]
layers:
  - place/gauges.yaml
  - place/markers.yaml
  - plans/dam-release.yaml
```

| Field | Rule |
| --- | --- |
| `from:` / `with:` | MUST NOT be set; mixins do not chain |
| `axes:` | Optional; sets axis values (e.g. `vertical: stacked`) |
| `applies_to:` | Optional; allowed values per axis. Checked against the resolved axes after composition (`E_MIXIN_AXES`); an axis left `any` by the archetype always passes |
| `provides.events` | Events whose `expects` roles this mixin's layers satisfy |
| `layers:` | Layer files with the same shape as place layers. A layer with a `place` key fails with `E_MIXIN` |
| `layers:` (plans) | `plans/<event>.yaml` paths in the mixin manifest **`layers:`** stack, wired to role-tagged rows (legacy top-level **`plans:`** is lifted by **`twin fmt`**) |

### Compose order and conflicts

1. Resolve the `from:` chain as today (`mergePlaceFromTwinfile`).
2. Apply each `with:` entry **in list order**. Layer rows merge by `id` (RFC 7396). Plans merge by filename.
3. Apply the child's `axes:`, `layers:`, and `plans:` last.

Order between two mixins is arbitrary to authors, so it MUST NOT silently decide anything:

- Two mixins setting **different values for the same axis**: `E_MIXIN_CONFLICT`.
- Two mixins defining the **same layer row id** or the **same plan filename**: `E_MIXIN_CONFLICT`, unless the child also defines that id or file (the child resolves the conflict).
- A mixin MAY patch a row that comes from the `from:` chain. Base → mixin is ordered, so this follows the RFC 7396 merge.
- The child always wins over mixins and bases, as `from:` children do today.

### Build records

- Build layer records (see `twin layers`) include each mixin layer with `kind: mixin` and a `with/<mixin>/<file>` ref, after the `from:` layers and before the child. When axes are declared, a final `patch` layer (`ref: axes`) sets the derived `place.archetype`.
- The `Twinfile.lock` chain digest covers the `with:` order, so reordering the list changes the digest even when the merged rows are identical.
- A base's own `with:` mixins compose just before that base, so each unit in the `from:` chain contributes "its mixins, then itself".

### Plans

- Plan paths are the nearest place unit's `plans:` (a child list replaces the base list) **plus** every mixin's `plans:`.
- A plan file resolves from the highest-precedence unit that has it: child, then its mixins, then the base chain.

### Golden mixins

- Golden mixins live under `examples/` and resolve as `twinfile/mixin-<name>:0.1.0`: one per catalog event (weather, transit, dam-release, litter, flood, earthquake, wildfire, tsunami, volcanic-ash mixins, …) and one per decoration layer kit (`mixin-assets`, `mixin-sensors`).
- Row ids are prefixed with the mixin's subject (`severe-weather-shelter`), so mixins never collide with each other.
- Mixin spaces sit on level `ground` and carry a `visit_order`, so they satisfy stacked and sequenced bases. Every golden base names its ground level `ground`.
- Axis values are set with the place's own `axes:`; no axis-only mixins ship, though a mixin MAY set `axes:`.

### Tooling

- `twin init place --geotype <slug>` writes `axes:` only for the axes the base archetype leaves open or sets differently, and emits one `with:` entry per suggested event and decoration layer kit, instead of stub files and copied plans. `--no-decorate` omits `with:`.

### Not yet implemented

- `twin check --strict` reporting which mixin supplied each role that a plan binds.

## Conformance

Fixtures: [`conf/compose/cases.json`](../conf/compose/cases.json) (category `compose`), plus schema vectors for a valid mixin and a mixin with `from:`.

- Mixin order is irrelevant when there are no conflicts (same rows, different chain digest).
- Two mixins with the same layer row id fail with `E_MIXIN_CONFLICT`; adding that id to the child passes.
- Two mixins setting different `vertical` values fail.
- `applies_to` rejects `mixin-dam-release` on a `footprint` place.
- `place.archetype: indoor_stack` with resolved axes `site / stacked / free` fails with `E_ARCHETYPE_AXES_MISMATCH`.

## Drawbacks

- One more composition mechanism alongside `from:`, layers, and events. [Composition](../doc/build/composition.md) gets longer.
- Mixin authors must pick globally distinct row ids (`dam-release-gauge-1`, not `gauge-1`) or children will see conflicts.
- Upgrading a mixin changes every place that uses it; pinned versions in `with:` refs are the only guard.

## Alternatives

- **More golden bases.** Simple, but grows with every archetype × event pair and still copies decorations.
- **Space-level `from:`** (a campus building space inheriting `base-indoor-stack`). Superseded for campuses by nested building units added with **`copy:`** ([RFC 0009](0009-dockerfile-model/index.md)).
- **Multiple `from:` entries.** Same expressive power, but blurs the single-parent model that `from:` children, locks, and reviewers rely on.
- **Keep copying stubs at init.** Works today (all place geotypes pass `twin check --strict`), but decorations drift from their source.
