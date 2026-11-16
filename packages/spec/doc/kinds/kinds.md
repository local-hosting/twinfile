# Six twin types (+ scene runs)

Twinfile hosts **six published twin types**: **place**, **resource**, **character**, **context**, **story**, **event**. Each has a typed head under `catalog/<type>/examples/<id>/` (character libs under `catalog/character/`). Wire JSON under `schemas/1/` where applicable.

| Type | Head `kind:` (in `<unit>.twin.yaml`) | Wire / contract | Notes |
| --- | --- | --- | --- |
| **place** | `place` | [`place-wire.schema.json`](../../schemas/1/run/place-wire.schema.json) | Spatial twin |
| **resource** | `resource` | [`res-wire.schema.json`](../../schemas/1/run/res-wire.schema.json) | Equipment, material, product |
| **character** | `character` | [Character / story contracts](character-story.md) | **`disclosure:`** required — who they are |
| **context** | `context` | [JTBD context](jtbd-context.md) | When [Context], I want to [Goal], so I can [Outcome] without [Obstacle]; story blesses character |
| **story** | `story` | Narrative JSON | Planned process — **input to the player** ([story-and-player.md](story-and-player.md)) |
| **event** | `event` | Event unit (`phases`, `expects`) | Timed occurrence a place hosts — [natural-hazards.md](natural-hazards.md), [`catalog/event/`](../../../../catalog/event/) |

**Runs are not twins.** Executable runs are inline **`run:`** blocks on **`story.scenes[]`** (`steps:`, `clock:`, `args:`), addressed as `<story-dir>#<scene-id>`. Optional **`use.runner`** is offline-only. Hosts pass **`twinfile/story/<id>:<ver>`** to the player; the player walks **`story.scenes`** and loads scene runs.

Timetable **stage packs** remain in the **simulator catalog** — not a sixth twin `kind:`.

Logical refs: `twinfile/<type>/<id>:<ver>` for the six types ([RFC 0008](../../rfcs/0008-typed-unit-refs/index.md)). OCI defaults to `ghcr.io/doppler-group/twinfile/<type>/<id>`.

## No `question`

Runner analyst prompts are **MCP-only** (`packages/cli/mcp/run-test-prompts.yaml`, `test_prompt` tool). Run heads do not carry `question:`.

## Pointers

- Folder layout: [unit-layout.md](../unit-layout.md)
- Glossary: [quick reference](../glossary.md#quick-reference-prose--on-disk)
- Standards: [standards-mapping.md](../standards-mapping.md)
