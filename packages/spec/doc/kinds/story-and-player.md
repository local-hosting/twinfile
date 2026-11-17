# Story → player (runtime)

## Separation

| Layer | Package | Role |
| --- | --- | --- |
| **Authoring** | `packages/core` | Four twin kinds + inline **`story.scenes[].run`** |
| **Playback** | `@doppler-group/twinfile-simulator` | **Clock**, **timeline**, **session bus**, **`createTwinfilePlayer`** |

There is **no** published `twinfile/clock` or `twinfile/player` ref. **Clock** is a field on a scene run; **player** is host/simulator code.

## Model

1. **Story** (`<unit>.twin.yaml`) — `story.scenes[]` (legacy `story.beats`), `links:` to place / character / resource.
2. **Scene run** — optional inline **`run:`** on a scene (`from?`, `steps:`, `clock:`, `args:`). **`from:`** defaults to the story's single **`links` `involves` place**. Optional **`use.runner`** only for offline `twin run`. Addressed as **`<story-dir>#<scene-id>`**; not published as its own ref.
3. **Player** — accepts **`twinfile/story/<id>:<ver>`**, builds linked places, walks scenes, advances **clock**, publishes session **edges** (and may spawn **runner** offline per scene).

**`createTwinfilePlayerFromStory(storyRoot, opts)`** (`@doppler-group/twinfile-simulator/host`) resolves a scene, calls **`buildTwinfile`** on the scene address, then **`createTwinfilePlayer`**. **`createTwinfilePlayer(result)`** remains for hosts that already built a place run (workbench lens path).

## Workbench (transitional)

**`?entry=<place>&lens=<run>`** maps one scene run. Prefer opening a **story** and letting the workbench pick the active scene.

## On disk

```text
story/examples/shop-visit/
  shop-visit.twin.yaml   # story.scenes[] with inline run:
  runs/                  # twin run output (not committed)
```

See [world session](../place/world-session.md), [kinds.md](kinds.md), [unit-layout.md](../unit-layout.md).