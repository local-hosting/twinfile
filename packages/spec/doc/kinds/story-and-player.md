# Story → player (runtime)

## Separation

| Layer | Package | Role |
| --- | --- | --- |
| **Authoring** | `packages/core` | Four twin kinds + inline **`story.scenes[].run`** |
| **Playback** | `@doppler-group/twinfile-simulator` | **Clock**, **timeline**, **session bus**, **`createTwinfilePlayer`** |

There is **no** published `twinfile/clock` or `twinfile/player` ref. **Clock** is a field on a scene run; **player** is host/simulator code.

## Model

1. **Story** (`<unit>.twin.yaml`) — `story.scenes[]` (legacy `story.beats`), `links:` to place / character / resource.
2. **Scene run** — optional inline **`run:`** on a scene (`from:`, `steps:`, `clock:`, `use.runner`, `expected:`). Addressed as **`<story-dir>#<scene-id>`**; not published as its own ref.
3. **Player** — accepts **`twinfile/story/<id>:<ver>`**, builds linked places, walks scenes, advances **clock**, publishes session **edges** (and may spawn **runner** offline per scene).

Today **`createTwinfilePlayer(result)`** still takes one **`BuildTwinfileResult`** (workbench transitional path). Target: **`createTwinfilePlayerFromStory(story, opts)`**.

## Workbench (transitional)

**`?entry=<place>&lens=<run>`** maps one scene run. Prefer opening a **story** and letting the workbench pick the active scene.

## On disk

```text
story/examples/shop-visit/
  shop-visit.twin.yaml   # story.scenes[] with inline run: + expected:
  runs/                  # twin run output (not committed)
```

See [world session](../place/world-session.md), [kinds.md](kinds.md), [unit-layout.md](../unit-layout.md).