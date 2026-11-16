# Open integration roadmap (Twinfile + MCP + patch + bridges)

Normative product boundary and implementation order for **any** app using Twinfile.

**Boundary summary:** [MCP](mcp.md) · [Bridges](bridges.md) · [Runners](runners.md) · [Campus → building → floor](../place/campus-building-floor.md).

## What stays open (`@twinfile/*`)

| Layer | Deliverable |
| --- | --- |
| **Format** | `modules[]`, `connections[]`, port types, `TwinMessage`, optional `patch.yaml` or manifest fields |
| **Validation** | `twin check --profile processors` (refs → merged `Place.data`, wire compatibility) |
| **UI projection** | `projectPatchGraphForUi`, `twinfile.patch.ui.v1`; MCP `twin://processors` (`graph` + `ui`) |
| **Bridges** | `bridgeModule` port metadata in `@local-hosting/twinfile-bridge`; `spec/conf/bridge-module-ports.yaml` |
| **Examples** | Golden patch units (shelter + resources); arena flood scenario |
| **MCP** | `processors_validate`, `twin://processors`; optional `bridge_import` |

## What stays outside (host adapters)

| Layer | Owner |
| --- | --- |
| Live message bus, Node-RED UI | Host patch runtime + canvas |
| Locker realtime sync | Host locker / replication plane |
| Feed compile / H3 lockers | Host feed compilers |
| AXM mount wire | `twinfile-locker` + ProductGrade |

## Phase 0 — Documentation (done / in progress)

- [x] Campus → building → floor cheat sheet and example layout/BUILDINGS.md
- [x] This roadmap + `integration.md` boundary table (MCP coverage: supported / planned / host-only)
- [x] RFC 0007 + patch schema + `conf/patch-module-types.yaml`

## Phase 1 — Patch interchange (spec) — v1 done

1. [x] RFC 0007 + [patch.md](patch.md)
2. [x] JSON Schema `PatchGraphV1` (`schemas/1/patch/`)
3. [x] `conf/patch-module-types.yaml` + `conf/bridge-module-ports.yaml`
4. [x] Resource pattern on arena concourse assets (`ext.shelter_resource`)
5. [x] `TwinMessageV1` envelope (`schemas/1/patch/twin-message.schema.json`)

**Exit:** schema vectors in `conf/index.json` — done for manifest `patch`.

## Phase 2 — Core validation — v1 done

1. [x] Bind `ref:space` / `ref:asset` against merged place
2. [x] `twin check --profile processors`
3. [x] Embed processor summary in build meta (`Place.meta.processors` ids + counts)

**Exit:** arena `twin check --profile processors` passes; wire mismatch fails check.

## Phase 3 — Bridge module catalog — v1 done

1. [x] `describeBridgePorts()` in `@local-hosting/twinfile-bridge`
2. [x] `conf/bridge-module-ports.yaml`
3. [x] Appendix: bridge `config.input` ↔ `importPlace` ([bridges.md](bridges.md#patch-module-ports-modbridge-import))

## Phase 4 — MCP — v1 done

1. [x] `processors_validate`
2. [x] `twin://processors` (`graph` + `ui` resource body)
3. [x] `bridge_import` tool
4. [x] `place_query` `ext` filters (`ext_key` / `ext_value`)

## Phase 5 — Examples & runners — v1 done

1. [x] Arena concourse cots/water assets
2. [x] Arena manifest patch graph (standup + bridge-import → map-sink)
3. [x] Scenario `arena-flood-shelter-standup` (catalog naming in [refs.md](refs.md))
4. [x] `verify` expected outputs + published refs refresh
5. [x] Runner resource-gap metrics documented in spec ([runners.md](runners.md))

## Phase 6 — Host adapters

Contract: [adapters/host.md](adapters/host.md). Reference primitives ship in `@local-hosting/twinfile-core` + workbench read path; durable locker + live bus scale-out stay host-owned.

1. [x] Patch runtime (core) — `createPatchMessageBus`, `TwinMessageV1`, manifest processor serde (`applyProcessorGraphToTwinfile`, …)
2. [x] Map viewer (core) — `slicePlaceForMapSink` for `place:merged` / `place:building` (no patch logic in map package)
3. [x] Flow pin (core) — `pinPatchFlow` / `PATCH_FLOW_COLLECTION_ID` (host CRUD + cross-host sync TBD)
4. [ ] Studio canvas — drag/drop + layout persistence (Vue/React host)
5. [ ] Workbench save — write `processors:` from UI (`upsertTwinfileProcessor` + `twin fmt` wired to HTTP)
6. [ ] `twinfile-locker` package — mirror `mount-locker` for `items.patch.flow.v1`

**Exit:** host studio saves `processors:` on the twin unit; map UI displays wired markers from messages.

## Ref grammar (optional)

- [x] RFC 0008 typed ref segment (`twinfile/scenario/...`) — schema + core parser; flat refs unchanged

## Dependency order

```text
Phase 1 (spec) → Phase 2 (core) → Phase 4 (MCP)
              ↘ Phase 3 (bridge) ↗
Phase 5 (examples) after 2 + 3 schemas stable
Phase 6 parallel once Phase 1–2 frozen
```

## Non-goals (v1 patch profile)

- Separate patch graphs per nested building (buildings are `copy:`-ed into the site graph — RFC 0009)
- Running host feed compilers inside `twin build`
- Replacing AXM `mount-locker` with patch storage
