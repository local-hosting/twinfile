# Integration: open Twinfile vs host extensions

Any application can depend on the **open stack** alone. Hosts add realtime UI, lockers, feeds, and proprietary module runtimes on top.

## Open surface (implement in `@local-hosting/twinfile`, `core`, `bridge`, `examples`)

| Capability | Entry |
| --- | --- |
| Author units | `<unit>.twin.yaml`, `place/*`, `bindings/*` |
| Build & verify | `twin build`, `twin check`, `twin layers` |
| Believability audit | `twin audit [dir] [--markdown \| --json] [--brief] [--pack \| --catalog]` — LLM-oriented structural card (cast, stage, motive, path, props, bless, gaps); `story/` audits every story; MCP `twin_audit` |
| Publish | OCI unit, `<unit>.twin.lock` |
| External formats | `@local-hosting/twinfile/bridge`, `twin import` / `export` |
| Scenarios | Events, `clock`, optional runners (`use.runner`); timeline in `@local-hosting/twinfile` |
| World session | — | Host **player** (not open package yet): `timeline.at(t)` → module bus — [World session](../place/world-session.md) |
| Agents | MCP — see [MCP coverage](#mcp-coverage) |
| Taxonomy | `@local-hosting/geotypes` (pinned on twinfile) |
| Patch graph | Schema + `twin check --profile processors` — [patch](patch.md), [roadmap](integration-roadmap.md) |

## Host extensions (do not import from `@local-hosting/twinfile`)

| Capability | Typical owner |
| --- | --- |
| Node-RED / patch canvas UI | Host patch UI |
| Live pub/sub between modules | Host patch runtime |
| Map collab (camera, selection) | Host map viewer |
| Platform feed lockers | Host feed data plane |
| Project twin mounts (Character/Story) | Host project locker + `@local-hosting/twinfile/character` / `@local-hosting/twinfile/story` |
| Org auth, fleet sync | Host studio / ops apps |

Hosts **should** read/write the same twin units on disk and use **`Place.digest`** for pin semantics.

## MCP coverage

| Area | Supported today | Planned (open) |
| --- | --- | --- |
| Merged place | `twin://twinfile/<id>:<version>/place`, `place_query`, `explain` | `twin://place` (session alias) |
| Compose | `twin://twinfile/<id>:<version>/layers` | `twin://layers` |
| Graph / paths | `place_path`, `twin_match` | — |
| Time | `state_at`, `narrate` | — |
| Scenarios | `run_fork`, `run_append` (`--allow-runs`) | — |
| Scaffold | `place_init` | — |
| Processor graph | `processors_validate`, `twin://twinfile/<id>:<version>/processors` | `twin://processors` |
| Bridge import | CLI, MCP `bridge_import` | — |

See [MCP](mcp.md) for tool schemas.

## Related

- [Open integration roadmap](integration-roadmap.md) — phased implementation
- [Host adapters](adapters/host.md) — Phase 6 contracts (patch runtime, map, locker)
- [Bridges](bridges.md) — format adapters vs patch module types (distinct from **views**: summary card / JSON-LD / Loro pack JSON)
- [Glossary — Views vs bridges](../glossary.md#views-vs-bridges-vs-host-adapters)
- [Campus → building → floor](../place/campus-building-floor.md) — hierarchy without a separate subspace type
