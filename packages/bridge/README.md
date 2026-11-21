# @local-hosting/twinfile-bridge

Twinfile **format bridges** — built-in IMDF, GTFS, Brick, BOT, SOSA, glTF, IFC, and **IndoorGML** (JSON profile) import/export, plus the shared **crosswalk**, **place-kit**, and **`resolveBridgeRef`** host.

Built-ins grouped by twin type:

| Type | Builtin ids |
| --- | --- |
| place | `imdf`, `indoorgml`, `ifc`, `bot`, `gltf` |
| resource | `brick`, `sosa` |
| event | `gtfs` |

Source layout:

| Path | Role |
| --- | --- |
| `src/` root | Host SDK (types, crosswalk, place-kit, CLI helpers) |
| `src/builtins/<id>/` | One built-in format each (`import.ts` / `export.ts`) |

Third-party bridges still publish separate npm packages that export `TwinBridge` and use `twin import --bridge npm:…` ([RFC 0006](../spec/rfcs/0006-bridge-plugins.md)).

Repository: **https://github.com/twinfile/bridge** (private). Conformance vectors live in [`@local-hosting/twinfile`](../spec/conf/map/).

### CI secrets

Actions checks out **`twinfile/spec`** for fixture tests. Set org/repo secret **`TF_PACKAGES_TOKEN`** (same as `twinfile/core`) with read access to private twinfile packages and repos.

See [`spec/doc/pack/bridges.md`](../spec/doc/pack/bridges.md).
