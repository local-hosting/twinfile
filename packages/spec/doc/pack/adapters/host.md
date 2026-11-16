# Host adapters (Phase 6)

Open Twinfile ships **validation and artifacts** in `@local-hosting/twinfile-core`. **Live patch runtimes**, map collaboration, and org lockers live in host repos. This page is the contract those hosts implement against.

## Patch runtime

| Responsibility | Open inputs | Host output |
| --- | --- | --- |
| Module bus | [TwinMessageV1](../../../schemas/1/patch/twin-message.schema.json), `conf/patch-module-types.yaml` | Route payloads between module ports |
| World session / player | `openTimelineForPlace`, scenario `clock:` | Advance `t`, scrub, play; publish IN messages from `timeline` edges and `placeType.controls` — not `use.runner` stdout |
| Canvas UI | `twin://processors` (`graph` + `ui`), `loadPatchModuleTypeCatalog()` | Edit `manifest.processors`, save to unit tree |
| Unit / module summary | MCP `place_card`, `twin summary`, `twin://place` | Host renders HTML from `TwinfileSummaryV1` (product UI pack in the host repo) |
| Catalog preview | MCP + `twin build` / `twin describe` | Open stack has no catalog web app. Product hosts MAY expose preview HTTP; **`entry`** = spatial host place; optional programme **lens** for session clock ([World session](../../place/world-session.md)). |
| Validation | `twin check --profile processors`, MCP `processors_validate` | Fail before wiring |

Hosts MUST NOT rewrite merged place geometry inside the patch editor; binds are **`ref:space`**, **`ref:asset`**, **`ref:building`** only.

### Canvas data flow

```text
Twinfile.yaml processors: + outlets:
  → buildProcessorsResourceFromTwinfile (ProcessorsResourceV1)
     or parseModuleGraphFromTwinfile + projectPatchGraphForUi
  → host canvas (Vue, React, Svelte, …) + layout (x/y)
  → serialize outlets: back to manifest → twin fmt → processors_validate
```

Core owns **wiring truth** (`PatchUiModel` / `ProcessorsResourceV1`) with **zero UI framework** deps. Open stack ships **CLI + MCP** only; product sites (e.g. twinfile.org) and host apps depend on twinfile, not vice versa.

## Map viewer (`MapSinkAdapter`)

| Wire | Payload | Viewer rule |
| --- | --- | --- |
| `place:merged` | `Place.data` shape | Full site layers |
| `place:building` | Filtered place slice | Highlight one `buildings[].id` |
| `twin:layer` | Host-defined style hints | Symbology only |

Patch logic stays **out** of the map package: the viewer consumes TwinMessages or `Place` snapshots; it does not run `checkProcessorGraph`.

## Locker (`patch-locker`)

Mirror [mount locker](../integration.md) patterns for flow catalog entries:

- Collection id proposal: `items.patch.flow.v1`
- Pin with `Place.digest` + manifest wiring hash
- Host CRUD; open stack validates on pull/build

## Exit criteria

1. Studio saves `processors:` on a twin unit and passes `twin check --profile processors`.
2. Map shows markers/layers driven by `place:merged` or `place:building` messages.
3. Optional locker round-trip for patch flows without forking `@local-hosting/twinfile` schemas.

## Related

- [integration-roadmap.md](../integration-roadmap.md) Phase 6
- [patch.md](../patch.md), RFC [0007](../../../rfcs/0007-patch-graph.md)
