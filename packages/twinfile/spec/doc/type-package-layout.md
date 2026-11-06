# Twin type layout (`packages/twinfile/src/catalog/<type>/`)

All six twin kinds live as **source trees inside `@local-hosting/twinfile`**, not separate npm packages. Domain code sits under `contract/` (portable wire); optional host glue under `mounts/`.

## Directory skeleton (all six)

```text
packages/twinfile/src/catalog/<type>/
  examples/<id>/              golden units
  test/                       package tests — not golden twins
  src/                        (or flat module root — follow siblings)
    index.ts                  public exports + twin module surface
    twin-module.ts            TwinTypeModule (kind, headFile, parse, build, …)
    contract/                 portable JSON/YAML contract implementation
    mounts/                   optional host / pack / locker wire (not twin heads)
    types/                    package-local types (mount wires, …)
```

**Character only:** shared YAML libraries under `character/libs/{audience,journey,psychology}/` — not twin heads.

## `contract/` by type

| Type | Subfolder | Role |
| --- | --- | --- |
| **place** | `place/`, `build/`, `check/` | `Place` compose/build, archetype checks, place mounts |
| **resource** | `asset/` *(planned)* | Resource rows when lifted from place |
| **character** | `persona/` | Persona only — who; JTBD lives on **context** |
| **context** | `contract/` | JTBD — `JobContextModel` |
| **story** | `narrative/` | Narrative — scenes, episodes, story-arc |
| **event** | *(module)* | Event unit — phases, `expects`, hazard catalog |

## Twin module

`twin-module.ts` builds its module with **`createHeadTwinTypeModule`** from `@local-hosting/twinfile`. Core owns the shared head check via **`parseTwinHead`**; each kind passes `kind`, head file, and optional `normalize` for legacy fields.

`twin build` finds the head with **`findTwinHead`** and dispatches through **`createTwinTypeRegistry`**. The CLI loads modules from source through the **`./<type>/module`** subpath on `@local-hosting/twinfile`.

## npm imports (stable)

| Import | Resolves to |
| --- | --- |
| `@local-hosting/twinfile/place` | Place compose, build, card, mounts |
| `@local-hosting/twinfile/event` | Event catalog module |
| `@local-hosting/twinfile/character` | Persona contract |
| `@local-hosting/twinfile/context` | JTBD contract |
| `@local-hosting/twinfile/story` | Narrative contract |
| `@local-hosting/twinfile/<type>/module` | `twin-module.ts` for CLI dispatch |

Retired names such as `@local-hosting/twinfile-event` are not published. Run `node packages/twinfile/scripts/codemod-unified-imports.mjs` after bulk renames.

## Rules

- Compose refs use **`twinfile/<type>/<id>:<ver>`** in YAML — not npm package names.
- Twin **heads** live only under `examples/`; library code under `src/` is parse/wire/export only.
- Cross-type links stay **refs** in YAML, not TypeScript imports between kinds (except story ↔ character at mount compile).

Unit folders: [unit-layout.md](unit-layout.md). Hub overview: [../../../catalog/README.md](../../../catalog/README.md).