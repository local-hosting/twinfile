# RFC 0005 — `buildings:` and `floors:` imports

## Summary

Campus-scale place units MAY import published **building** and **floor** place units via manifest `buildings:` (nested `floors:`), instead of copying interior YAML into site `layers:`.

Status: Superseded by [RFC 0009](0009-dockerfile-model/index.md) — `twinfile: 2` replaces `buildings:` / `floors:` with ordered `copy: ./buildings/<name>` patches (`into:`, `prefix:`). Kept for history; core no longer reads these fields.
Created: 2026-11-10

## Motivation

[RFC 0004](0004-composed-bases.md) keeps a single `from:` skeleton and shares decorations with `with:` mixins. Multi-building sites (airport, hospital, expo) still duplicate interior topology in one folder or rely on informal layer splits. Authors want **one campus twin** with **indoor_stack twins per building/floor**, like Docker `COPY --from=` stages.

## Specification

### Manifest

On `kind: place` only:

```yaml
from: twinfile/base-campus:0.1.0
buildings:
  - id: terminal-a          # site anchor space id (must exist after site layers)
    from: twinfile/terminal-a:0.1.0
    prefix: terminal-a-     # optional; default "<id>-"
    floors:
      - from: twinfile/terminal-a-airside:0.1.0
        level: airside      # optional; used in default floor prefix
```

| Field | Rule |
| --- | --- |
| `buildings[].id` | Twin id; must match a `spaces[].id` on the site graph before imports run |
| `buildings[].from` | Optional twinfile ref to a **place** unit (typical `indoor_stack`) |
| `buildings[].floors[]` | Optional extra slices merged after the building `from` |
| `prefix` | Prepended to every imported row `id` and internal refs; site anchor id is not prefixed |

Building units SHOULD omit `levels.yaml` when site levels already name floors (e.g. `ground`, `airside`). Imported level ids are not merged into the site; spaces may reference site level ids.

### Compose order

After the usual `from:` chain, `with:` mixins, and site `layers:`:

1. Each `buildings[].from` (in list order)
2. Each nested `floors[]` (in list order)

Each import runs `composePlace` on the child unit, prefixes ids, strips child `place` metadata and `levels`, then merges into the site graph. Provenance refs use `building/<id>/…` and `floor/<id>/<n>/…`.

### Plans

Plan paths from imported units union with site and mixin plans (same rules as mixins for file lookup).

### Errors

| Code | When |
| --- | --- |
| `E_BUILDING_ANCHOR` | No site space for `buildings[].id` |
| `E_BUILD` | Invalid twinfile, non-place ref, child compose failure |

## Conformance

Authoring patterns (single vs `floors:` child, checklist): [Campus → building → floor](../doc/place/campus-building-floor.md).

Golden catalog (see [`examples/README.md`](../../../catalog/place/examples/README.md)):

| Site | Pattern | Child unit(s) |
| --- | --- | --- |
| [`airport`](../../../catalog/place/examples/airport) | `buildings` + nested `floors` | `terminal-a`, `terminal-a-airside` |
| [`transit-hub-campus`](../../../catalog/place/examples/mobility-hub/campus) | single building | `transit-hub-interior` |
| [`expo`](../../../catalog/place/examples/expo) | single pavilion | `expo-pavilion-opportunity` |
| [`arena`](../../../catalog/place/examples/arena) | concourse interior | `arena-concourse` |
| [`port`](../../../catalog/place/examples/port) | warehouse | `port-warehouse` |
| [`park`](../../../catalog/place/examples/park) | *(none — `open_area`)* | — |

## Drawbacks

- Prefix discipline required for human ids (`terminal-a-concourse`).
- Child units must be published/resolvable like any `from:` ref.
- No automatic site ↔ building openings across unit boundaries yet (author on site layers).

## Alternatives

- **More `layers:` files only** (status quo).
- **Space-level `from:`** on a row — superseded by explicit `buildings:` for review and locks.
- **Multiple `from:`** on the site — rejected in RFC 0004.
