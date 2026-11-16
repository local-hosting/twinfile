# Processor graph (module wiring)

Optional **`processors:`** on place or scenario manifests describes a **declarative processor graph** (Max/MSP-style objects + **`outlets:`** patch cords). Validation only — no runtime in `@doppler-group/twinfile-core`.

**Build** (see [Composition](../build/composition.md)) runs manifest **`steps:`** to produce a deterministic **`Place.data`**; **`processors:`** declares **host module I/O** beside that image (RFC 0007).

| Piece | Location |
| --- | --- |
| Schema | `schemas/1/patch/patch-graph.schema.json`, `schemas/1/patch/twin-message.schema.json` |
| Manifest shape | `processors[]` with optional `outlets:` per processor (`patch-graph.schema.json` → `manifestProcessor`) |
| Open module types | `conf/patch-module-types.yaml` (`facet: internal` = scope plumbing; cards show wired I/O only) |
| Bridge module ports | `conf/bridge-module-ports.yaml` |
| RFC | [0007-patch-graph](../../rfcs/0007-patch-graph.md) |

## CLI

```bash
twin check [dir] --profile processors
```

Runs JSON Schema plus semantic checks (binds, processor ids, outlet wires) when `processors:` is set. `--profile patch` is a deprecated alias.

## MCP

`processors_validate` — same rules as the check profile (see [MCP](mcp.md)).

Resource `twin://processors` — `twinfile.processors.resource.v1`: **`graph`** (`PatchGraphV1`), **`ui`** (`twinfile.patch.ui.v1` from `projectPatchGraphForUi`), and **`Place.digest`**.

## Canvas UI (hosts)

| API | Purpose |
| --- | --- |
| `parseModuleGraphFromTwinfile(twinfile)` | Canonical graph (`modules` + `connections`) |
| `projectPatchGraphForUi(graph, catalog)` | Ports per processor, resolved cord `wire` types, binds |
| `loadPatchModuleTypeCatalog()` | Module types + port defs (`conf/patch-module-types.yaml`) |
| `checkProcessorGraph(twinfile, Place.data)` | Same validation as CLI / MCP (`Place` from `twin build`) |

Hosts add **layout** (node positions, grouping). Persist wiring only in **`processors:`** / **`outlets:`**; optional layout sidecars are host-defined until a spec field exists. See [host adapters](adapters/host.md).

### Framework hosts (Vue, React, Svelte, …)

`@doppler-group/twinfile-core` has **no UI runtime** (no React/Vue/DOM). Integrate with plain JSON:

| Integration | Entry |
| --- | --- |
| In-app (bundled) | `buildProcessorsResourceFromTwinfile(twinfile, { digest? })` → `ProcessorsResourceV1` |
| MCP / HTTP | `twin://processors` — same shape as `ProcessorsResourceV1` |
| Summary only | `TwinfileSummaryV1` — optional; render in the host UI pack, not required in core |

Recommended loop: load manifest → `buildProcessorsResourceFromTwinfile` → render `ui.modules` / `ui.connections` in your framework → edit → write `processors:` / `outlets:` → `twin fmt` → `checkProcessorGraph` or `processors_validate`.

Schema constants: `TWINFILE_PROCESSORS_RESOURCE_SCHEMA`, `TWINFILE_PATCH_UI_SCHEMA`.

## Merged place

A **merged place** is **`Place.data`**: the JSON object `twin build` produces after **`from:`** and ordered **`steps:`**, including **`copy:`** of nested building and floor units ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)). Runners and MCP read that object, not raw layer files. See [Built Place](../build/built-place.md).

| Term | Meaning |
| --- | --- |
| **Built place** | In-memory **`Place`** — `Place.data`, `Place.meta`, `Place.digest` |
| **Merged place** | **`Place.data`** only (collections + run extras such as `events`) |
| **Wire `place:merged`** | Port payload shaped like **`Place.data`** (not full `Place.toWire()` unless noted) |

## Authoring

```yaml
processors:
  - id: feeds
    type: twinfile/mod.bridge-import@0.1.0
    outlets:
      - port: place
        to: { processor: map-campus, port: in }
  - id: hub-scope
    type: twinfile/mod.building-scope@0.1.0
    bind:
      anchor: ref:building:transit-hub
    outlets:
      - port: scoped
        to: { processor: map-hub, port: building }
  - id: map-campus
    type: twinfile/mod.map-sink@0.1.0
  - id: map-hub
    type: twinfile/mod.map-sink@0.1.0
```

Legacy manifest `patch: { modules, connections }` and `inputs` / `outputs` / `connections` normalize to this shape via **`twin fmt`**.

## Wire tiers and binds

| Wire | Host view |
| --- | --- |
| `place:merged` | Full merge (campus-wide map, cross-building) |
| `place:site` | Site-authored rows (hosts may omit imported prefixes) |
| `place:building` | One building anchor + prefixed child ids |

| Bind | Validates |
| --- | --- |
| `ref:space:<id>` | Merged `spaces[]` |
| `ref:asset:<id>` | Merged `assets[]` |
| `ref:building:<anchor>` | `copy:` `into:` anchor and site space |

**`twinfile/mod.building-scope@0.1.0`**: `in` = `place:merged`, `scoped` out = `place:building`; bind `anchor: ref:building:<id>`.

Golden: [`examples/arena`](../../../../catalog/place/examples/arena/), [`transit-hub-campus`](../../../../catalog/place/examples/mobility-hub/campus/).

## Event pulses (`twin:event`)

Host context publishes [`TwinMessageV1`](../../schemas/1/patch/twin-message.schema.json) with `wire: twin:event` on a module **`in`** port (e.g. `twinfile/mod.event-in@0.1.0`). Payload convention (validation in `@doppler-group/twinfile-core`):

| Field | Meaning |
| --- | --- |
| `eventRef` | Pack ref or `id` from `Place.data.events[]` |
| `phase` | Must be in event `phases` |
| `pulse` | `fast` \| `long` |
| `edge` | `enter` \| `exit` \| `tick` (fast); long uses `enter` + `until` |
| `until` | ISO end for long pulse |
| `args` | Event call-site args |

Context **feeds** use wires `signal:rain`, `signal:alert`, `signal:rating`, `signal:volume`, `signal:open`, `signal:trigger`, `signal:status`, `signal:occupancy` into `twinfile/mod.signal-hub@0.1.0` (see `conf/patch-module-types.yaml`). Hub **outputs** `signal:status` and `signal:occupancy` are the usual open place columns.

### Control lane vs data lane

| Lane | Wire | Host use |
| --- | --- | --- |
| **Data** | `signal:*` (except sparse controls) | GTFS, weather, ratings — continuous feeds into signal-hub inlets |
| **Control** | `signal:trigger` | Sparse programme / workbench controls (`PlaceControlType` in `@doppler-group/twinfile-core`), not `kind: event` compose timetables |

Controls are declared by **`plan.for`** ids on the place (`transit-disruption`, `passenger-queue`, …). Hosts publish object payloads on `signal:trigger` → signal-hub `trigger` (default module id `context-signals` when `processors:` is omitted). A host **player** advancing scenario **`clock:`** should emit the same payloads on play — see [World session](../place/world-session.md).

### Place Type (`Place.meta.placeType`)

Every **`twin build`** of a **place** emits **`twinfile.place-type.v1`** on **`Place.meta.placeType`**:

| Field | Meaning |
| --- | --- |
| `controls[]` | Accepted control ids, target wire, optional phases, `inlet` module/port |
| `dataInlets[]` / `dataOutlets[]` | Open patch host ports from `processors:` (or default signal-hub inlets) |
| `logicalOutputs[]` | Always includes **`place.merged`** (`wire: place:merged`) |

Host summaries and workbench port lists use `PlaceType.toHostIo()` on this snapshot. Validation: `validatePlaceTypeV1` at build time (AJV against `schemas/1/place/place-type.schema.json`; optional on `Place.meta` via `place-wire.schema.json` (wire `twin://place`).

## Related

- [Integration](integration.md) · [Integration roadmap](integration-roadmap.md) · [Bridges](bridges.md) · [Campus → building → floor](../place/campus-building-floor.md)
