# RFC 0006 — Bridge extensions and plugins

## Summary

External formats (IMDF, GTFS, IFC, glTF, …) are **bridge extensions**: normative mappings in `spec/conf/crosswalk.yaml` plus optional **npm bridge plugins** that implement import/export.

Status: Accepted (implemented in `@local-hosting/twinfile/bridge`, `@local-hosting/twinfile`)
Created: 2026-11-10

## Motivation

Place twins stay native `place/*.yaml`. Appendix mappings ([`doc/map/appendix.md`](../doc/map/appendix.md)) document how vendor fields land on Twinfile collections. Implementations were a closed list inside `@local-hosting/twinfile`, which blocks third-party IFC or glTF bridges and couples spec evolution to core releases.

Runners already use `npm:` refs ([`doc/pack/runners.md`](../doc/pack/runners.md)). Bridges follow the same pattern.

## Specification

### Crosswalk extension

Each bridge declares a **`crosswalkSource`** id (the `source:` key in [`conf/crosswalk.yaml`](../conf/crosswalk.yaml)). New bridges MUST add appendix prose and crosswalk rows before claiming conformance. Unknown terms still land in `ext`.

### Bridge plugin contract

An npm package MAY export:

```typescript
export const bridge: TwinBridge;
```

| Field | Rule |
| --- | --- |
| `id` | Stable bridge id (e.g. `imdf`, `gltf`) |
| `crosswalkSource` | Matches crosswalk `source:` |
| `roles` | `import`, `export`, and/or `geometry` |
| `importPlace?` | `unknown → ImportResult` (YAML scaffold + partial `place`) |
| `exportPlace?` | `Place.data → Record<relativePath, string>` |

Built-in bridges ship in **`@local-hosting/twinfile/bridge`** (`src/builtins/<id>/`). Built-in ids resolve in-process (`imdf`, `gtfs`, …). Third-party packages use `npm:@scope/my-bridge@^0` and export `TwinBridge`.

### CLI

```
twin import <source> <path> --out <dir>
twin import --bridge <npm:…|source-id> <path> --out <dir>
twin export <source> [dir] --out <dir>
twin export --bridge <npm:…|source-id> [dir] --out <dir>
```

When `--bridge` is set, `<source>` position arguments are optional; the bridge ref supplies behavior. Legacy `twin import imdf` remains equivalent to the built-in `imdf` bridge.

GTFS inputs stay a directory with `stops.txt` / `shapes.txt`. glTF bridge input is JSON `{ "path": "sources/scene.glb", "node?": "…", "name?": "…" }` (see appendix).

### Manifest (optional)

A place unit MAY declare provenance hooks:

```yaml
bridges:
  - id: venue-imdf
    bridge: npm:@local-hosting/twinfile/bridge@^0
    role: import
```

Manifest `bridges:` is informational in v1; CLI performs imports. Future tools MAY run declared bridges at `twin build`.

### Conformance

Each certified bridge adds fixtures under `spec/conf/map/`. Built-in bridges in `@local-hosting/twinfile/bridge` MUST pass existing map vectors.

## Drawbacks

Dynamic `import()` of npm packages requires installed dependencies and is not audited in `twin check` today.

## Alternatives

- Keep all importers in core (rejected: no extension point).
- OCI bridge units (deferred; npm matches runners).
