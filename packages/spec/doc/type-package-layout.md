# Twin type package layout (`catalog/<type>/`)

Each published twin type is a Yarn workspace under **`catalog/<type>/`** with the same **skeleton**. Domain code lives under `src/contract/` (portable wire); host glue lives under `src/mounts/`.

## Workspace root (all six)

```text
catalog/<type>/
  package.json              @local-hosting/twinfile-<type>
  README.md
  examples/<id>/              golden units
  test/                       package tests — not golden twins
  src/
    index.ts                  public exports + twin module surface
    twin-module.ts            TwinTypeModule (kind, headFile, parse, build, …) + head normalizer
    contract/                 portable JSON/YAML contract implementation
    mounts/                   optional host / pack / locker wire (not twin heads)
    types/                    package-local types (mount wires, …)
```

**Character only:** shared YAML libraries under `catalog/character/libs/{audience,journey,psychology}/` — not twin heads.

## `src/contract/` by type

| Type | Subfolder | Role |
| --- | --- | --- |
| **place** | `place/`, `build/`, `check/` | `Place` compose/build, archetype checks, place mounts |
| **resource** | `asset/` *(planned)* | Resource rows when lifted from place |
| **character** | `persona/` | Persona — `contract/`, `journey/`, `empathy/`, `people/`, `schemas/` |
| **character** | `persona/` | Persona only — JTBD re-exports `@local-hosting/twinfile-context` via deprecated `/situations` |
| **context** | `contract/` | JTBD — `JobContextModel`: When [Context], I want to [Goal], so I can [Outcome] without [Obstacle] |
| **story** | `narrative/` | Narrative — `contract/`, `scene/`, `episode/`, `story-arc/` |
| **event** | *(module)* | Event unit — phases, `expects`, hazard catalog |

## Twin module

`twin-module.ts` builds its module with **`createHeadTwinTypeModule`** from `@local-hosting/twinfile-core`. Core owns the shared head check (`kind`, required `id`, `name`, `links`) via **`parseTwinHead`**; the type package passes its `kind`, head file, and an optional `normalize` for legacy fields (story: `story.beats` → `story.scenes`). Place `build` calls `buildTwinfile` in this package; core keeps load, lock, pack, and generic twin kernel.

`twin build` finds the head with **`findTwinHead`** and dispatches non-place kinds through **`createTwinTypeRegistry`**. Keep `twin-module.ts` free of relative imports — the CLI loads it from source through the **`./module`** subpath.

npm subpaths (stable):

- `@local-hosting/twinfile-<type>/module` → `catalog/<type>/src/twin-module.ts`
- `@local-hosting/twinfile-character/persona` → `catalog/character/src/contract/persona/` (legacy subpath name)
- `@local-hosting/twinfile-context` → `catalog/context/src/contract/`
- `@local-hosting/twinfile-character/situations` → re-exports `@local-hosting/twinfile-context` (deprecated)
- `@local-hosting/twinfile-story/narrative` → `catalog/story/src/contract/narrative/` (legacy subpath name)

## Rules

- Prose and identifiers use **character** / **context** / **story** — not three-letter acronyms. npm subpaths are `persona`, `situations` (JTBD; alias toward context), and `narrative`. JTBD triad: **context** (situation) → **goal** (job/progress) → **outcome** (definition of success).
- No nested package name folders — use `contract/<domain>/contract/` for load/save/json.
- Twin **heads** (`<unit>.twin.yaml`, …) are only under `catalog/<type>/examples/`; `src/` is library code for parse/wire/export.
- Cross-type links stay **refs** in YAML (`twinfile/<type>/<id>`), not TypeScript imports between type packages (except story narrative optionally peers character for mount compile).

Unit folders: [unit-layout.md](unit-layout.md). Hub overview: [../../../catalog/README.md](../../../catalog/README.md).