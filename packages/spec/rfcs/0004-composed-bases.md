# RFC 0004 — composed bases (`axes:`)

## Summary

Let a place declare its archetype axes (`axes:`) so reviewers can see which axis made a place `campus` rather than `indoor_stack`, without adding a golden base per combination.

Status: Accepted (implemented in `@local-hosting/twinfile-core`). The `with:` mixin list this RFC first proposed has been withdrawn; see [Withdrawn: `with:` mixins](#withdrawn-with-mixins).
Created: 2026-11-06

## Motivation

[Place archetypes](../doc/place/place-archetypes.md) splits every place into three axes (extent, vertical, movement). `place.archetype` names the result, but nothing records which axis made a place `campus` rather than `indoor_stack`, so reviewers cannot see what changed when a base is swapped.

Campus sites with separate interior twins nest building and floor Twinfiles and add them with **`copy: ./buildings/<name>`** ([RFC 0009](0009-dockerfile-model/index.md)).

## Specification

### `axes:` on a place manifest

```yaml
twinfile: 2
kind: place
id: river-hospital
from: twinfile/base-campus:0.1.0
axes:
  vertical: stacked
steps:
  - place: { name: River hospital }
  - spaces: []
```

- **`axes:`** is optional. Keys are `extent`, `vertical`, and `movement`, with the values from [Place archetypes](../doc/place/place-archetypes.md#axes). Omitted keys inherit from the composed base.
- The **resolved axes** are computed in compose order: the `from:` chain, then the child's own `axes:`.
- The **archetype** is `archetypeForAxes(resolved axes)`. If `place.archetype` is also set, it MUST equal the derived value (`E_ARCHETYPE_AXES_MISMATCH`). Incomplete or invalid combinations fail with `E_ARCHETYPE_AXES`.
- Load-time axis rules ([Validation per axis](../doc/place/place-archetypes.md#validation-per-axis)) run on the resolved axes.

### Build records

When axes are declared, a final `patch` layer (`ref: axes`) sets the derived `place.archetype`.

### Tooling

`twin init place --geotype <slug>` writes `axes:` only for the axes the base archetype leaves open or sets differently. Decoration layers the geotype suggests (`assets`, `sensors`) are written as starter rows in the unit's own `steps:`; `--no-decorate` omits them.

## Withdrawn: `with:` mixins

The first version of this RFC added `kind: mixin` units and an ordered `with:` list. Events replaced the hazard mixins: a place hosts an event through the role tags its base already carries. The only remaining mixins added one starter `assets` or `sensors` row each, which is cheaper to write into the place than to compose. `kind: mixin`, `with:`, `applies_to`, and the `E_MIXIN*` codes are gone; `twin fmt --upgrade=2` rejects a manifest that still declares `with:`.

## Conformance

Fixtures: [`conf/compose/cases.json`](../conf/compose/cases.json) (category `compose`), plus schema vectors rejecting `kind: mixin` and a place `with:`.

- Complete axes derive the archetype (`area / flat / free` is `open_area`).
- Incomplete axes fail with `E_ARCHETYPE_AXES`.
- `place.archetype: indoor_stack` with resolved axes `site / …` fails with `E_ARCHETYPE_AXES_MISMATCH`.

## Alternatives

- **More golden bases.** Simple, but grows with every archetype combination.
- **Space-level `from:`** (a campus building space inheriting `base-indoor-stack`). Superseded for campuses by nested building units added with **`copy:`** ([RFC 0009](0009-dockerfile-model/index.md)).
- **Multiple `from:` entries.** Same expressive power, but blurs the single-parent model that `from:` children, locks, and reviewers rely on.
