# RFC 0007 — patch interchange (declarative module graph)

Status: Proposed  
Created: 2026-03-23

## Summary

Place and scenario units may declare **`processors:`** — Max/MSP-style module objects with optional **`outlets:`** (out-port → in-port cords). Twinfile validates structure and **binds** against the **merged place**; it does not execute messages. Legacy `patch: { modules, connections }` normalizes via `twin fmt`.

## Motivation

Hosts need a portable graph on disk beside `Place.data`. Open stack owns schema, refs, `projectPatchGraphForUi`, and `twin check --profile processors`; hosts own buses and canvas UI ([integration](../doc/pack/integration.md)).

## Specification

### Manifest

Place and scenario manifests use **`processors:`** (Max/MSP-style objects). Each processor may list **`outlets:`** — patch cords from an outbound port to another processor’s inlet. Internal validation still uses [PatchGraphV1](../schemas/1/patch/patch-graph.schema.json) (`modules` + `connections`).

```yaml
processors:
  - id: gtfs
    type: twinfile/mod.bridge-import@0.1.0
    outlets:
      - port: place
        to: { processor: map, port: in }
  - id: shelter
    type: twinfile/mod.shelter-standup@0.1.0
    bind:
      focus: ref:space:concourse-lower
  - id: map
    type: twinfile/mod.map-sink@0.1.0
```

### Module `type`

Semver module type id (`twinfile/mod.*@x.y.z`). Port names and wire types for open types live in `conf/patch-module-types.yaml`.

### `bind`

| Form | Validates |
| --- | --- |
| `ref:space:<id>` | Row in merged `spaces[]` |
| `ref:asset:<id>` | Row in merged `assets[]` |
| `ref:building:<anchor>` | `buildings[].id` on this manifest and a site space with that id |

**Merged place** means **`Place.data`** — output of compose (`from:` plus the ordered `steps:` list, including `copy:` of nested buildings — [RFC 0009](0009-dockerfile-model/index.md)), not a single authoring file. Wire **`place:merged`** means a port carries the full merge; **`place:building`** / **`place:site`** are filtered views hosts may derive (see [patch graph](../doc/pack/patch.md)).

Open module **`twinfile/mod.building-scope@0.1.0`**: `in` accepts `place:merged`, `scoped` emits `place:building`; bind `anchor: ref:building:<id>` names the RFC 0005 import.

### Connections

`from` / `to` name a **module id** and **port** declared on that module’s type catalog entry. Wire compatibility: outbound `wire` on `from` must equal inbound `wire` on `to`.

### TwinMessageV1

Hosts that run a patch bus SHOULD wrap port payloads in [TwinMessageV1](../schemas/1/patch/twin-message.schema.json): `wire` names the patch wire type; `payload` carries the body; optional `from` / `to` name module ports.

### Resources (until a dedicated collection)

Shelter capacity may appear on assets, e.g. `ext.shelter_resource` + `capacity` (golden: `examples/arena-concourse`).

## Conformance

- Schema vectors `schema-ok-place-patch-graph`, `schema-bad-place-patch-bind` in `conf/index.json`.
- `twin check --profile processors` runs semantic validation when `processors:` is present.

## Drawbacks

- Do not confuse **`steps:`** (deterministic `Place` build, RFC 0009) with **`processors:`** (host wiring). Prose: **build steps** vs **processor graph**.

## Alternatives

- Separate `patch.yaml` unit kind — deferred; inline manifest keeps one OCI tree.
