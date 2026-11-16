# Four twin types (+ scene runs)

Twinfile hosts **four published twin types**: **place**, **resource**, **character**, **story**. Each has a typed head under `catalog/<type>/examples/<id>/` (character libs under `catalog/character/`). Wire JSON under `schemas/1/`.

| Type | Head file | Wire schema | Notes |
| --- | --- | --- | --- |
| **place** | `Place.yaml` (legacy `Twinfile.yaml`) | [`place-wire.schema.json`](../../schemas/1/run/place-wire.schema.json) | Spatial twin |
| **resource** | `Resource.yaml` | [`res-wire.schema.json`](../../schemas/1/run/res-wire.schema.json) | Equipment, material, product |
| **character** | `Character.yaml` | [PCM / SAM](pcm-sam.md) | **`disclosure:`** required |
| **story** | `Story.yaml` | SAM JSON | Planned process — **input to the player** ([story-and-player.md](story-and-player.md)) |

**Runs are not twins.** Executable presets live under **`story/.../scenes/<id>/run.yaml`** (`role: run`, `clock:`, `use.runner`). Hosts pass **`twinfile/story/<id>:<ver>`** to the player; the player walks **`story.scenes`** and loads scene runs.

**Situations** and timetable **stage packs** remain in the **simulator catalog** (`catalogKind: situation` \| `event` in TypeScript) — not `kind: event` twins.

Logical refs: `twinfile/<type>/<id>:<ver>` for the four types ([RFC 0008](../../rfcs/0008-typed-unit-refs/index.md)). OCI defaults to `ghcr.io/local-hosting/twinfile/<type>/<id>`.

## No `question`

Runner analyst prompts are **MCP-only** (`packages/cli/mcp/run-test-prompts.yaml`, `test_prompt` tool). Run heads do not carry `question:`.

## Pointers

- Folder layout: [unit-layout.md](../unit-layout.md)
- Glossary: [five-type quick reference](../glossary.md#quick-reference-prose--yaml) *(prose “event” = simulator catalog or live session, not a twin)*
- Standards: [standards-mapping.md](../standards-mapping.md)