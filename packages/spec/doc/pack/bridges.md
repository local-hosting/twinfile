# Bridges

Bridges map **external formats** into native Twinfile place layers (or attach opaque geometry). Normative field rules live in [`doc/map/appendix.md`](../map/appendix.md) and [`conf/crosswalk.yaml`](../../conf/crosswalk.yaml). Built-ins ship in **`@local-hosting/twinfile-bridge`**; optional third-party packages use **`npm:`** refs ([RFC 0006](../../rfcs/0006-bridge-plugins.md)).

## CLI

```bash
twin import imdf venue.json --out ./places/imported
twin import --bridge imdf venue.json --out ./places/imported
twin export imdf ./places/shop --out ./export
```

`@local-hosting/twinfile-core` depends on `@local-hosting/twinfile-bridge`, which includes every built-in below under `src/builtins/<id>/`.

| id | Roles |
| --- | --- |
| `imdf` | import, export |
| `gtfs` | import, export |
| `brick` | import, export |
| `bot` | import, export |
| `sosa` | import, export |
| `gltf` | import, geometry |
| `ifc` | import (STEP via `web-ifc` or JSON projection) |
| `indoorgml` | import, export ([IndoorGML JSON profile](#indoorgml-ogc-cell-space)) |

## Authoring a bridge package

1. Add appendix + crosswalk rows to `@local-hosting/twinfile` (or publish a crosswalk fragment and document merge).
2. Publish a package that exports `bridge: TwinBridge` from its main entry (or subpath).
3. Register conformance fixtures.

```typescript
import type { TwinBridge } from '@local-hosting/twinfile-bridge';

export const bridge: TwinBridge = {
  id: 'ifc',
  crosswalkSource: 'ifc',
  roles: ['import'],
  importPlace(input) {
    // …
  },
};
```

## IndoorGML (OGC cell space)

Full GML/XML ingest is not in scope yet. Use the **`twinfile.bridge.indoorgml.v1`** JSON profile aligned with OGC IndoorGML core modules:

```bash
twin import indoorgml indoorgml.json --out ./places/imported
twin export indoorgml ./places/imported --out ./export
```

| Profile field | Meaning |
| --- | --- |
| `cellSpaces[]` | Non-overlapping **cells** (primal space) → `spaces[]` |
| `transitions[]` (`connects`) | **Transition** between two cells at a threshold → `openings[]` |
| `statePaths[]` | Weighted **State** graph edges → `routes[]` |
| `layers[]` | Multi-layered space interpretations → `place.ext.indoorgml.layers` |

See [appendix](../map/appendix.md#indoorgml-json-profile) and [topology taxonomy](../place/topology-taxonomy.md#indoorgml-correspondence-informative).

## Geometry bridges (glTF)

glTF/GLB does not replace the place graph. The glTF bridge writes a minimal place whose spaces use **`geometry.ref`**: `sources/<file>#<node-id>`. See appendix **glTF**.

## Relation to runners and views

| Mechanism | Extends |
| --- | --- |
| **Bridge** | Authoring-time import/export and geometry attachment |
| **View** | One-way presentation (`twin summary`, `twin export jsonld`, `renderTwinfileLoroView`) — not a bridge |
| **Runner** (`use.runner: npm:…`) | Offline answer on a built bundle (stdout JSONL) |
| **Player** (host) | Same **timeline** as runners; publishes on patch module bus — [World session](../place/world-session.md) |

Refs grammar for `npm:` matches [Runners](runners.md).

## Patch module ports (`mod.bridge-import`)

Open patch graphs wire **`twinfile/mod.bridge-import@0.1.0`** with port **`source`** (`wire: bridge:source`) and output **`place`** (`wire: place:merged`). Host runtimes pass a bridge id or `npm:` ref on `source`; the import body is whatever that bridge’s **`importPlace`** accepts (GTFS directory paths, IMDF JSON, glTF descriptor JSON, IFC bytes wrapper, etc.). See `conf/bridge-module-ports.yaml` and each built-in under `@local-hosting/twinfile-bridge/src/builtins/<id>/`. CLI parity: `twin import --bridge …` and MCP `bridge_import`.
