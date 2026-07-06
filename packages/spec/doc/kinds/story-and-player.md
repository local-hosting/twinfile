# Story → player (runtime)

## Separation

| Layer | Package | Role |
| --- | --- | --- |
| **Authoring** | `packages/core` | Four twin kinds + **`scenes/<id>/run.yaml`** on stories |
| **Playback** | `@local-hosting/twinfile-simulator` | **Clock**, **timeline**, **session bus**, **`createTwinfilePlayer`** |

There is **no** published `twinfile/clock` or `twinfile/player` ref. **Clock** is a field on a scene run; **player** is host/simulator code.

## Model

1. **Story** (`<unit>.twin.yaml`) — `story.scenes[]` (legacy `story.beats`), `links:` to place / character / resource; each scene may set **`run: ./scenes/<id>`**.
2. **Scene folder** — `run.yaml` with the former preset body (`from:`, `clock:`, `use.runner`, …). Not published as its own ref.
3. **Player** — accepts **`twinfile/story/<id>:<ver>`**, builds linked places, walks scenes, advances **clock**, publishes session **edges** (and may spawn **runner** offline per scene).

Today **`createTwinfilePlayer(result)`** still takes one **`BuildTwinfileResult`** (workbench transitional path). Target: **`createTwinfilePlayerFromStory(story, opts)`**.

## Workbench (transitional)

**`?entry=<place>&lens=<run>`** maps one scene run. Prefer opening a **story** and letting the workbench pick the active scene.

## On disk

```text
story/examples/shop-visit/
  shop-visit.twin.yaml
  scenes/
    shop-shelter-at-cap/
      run.yaml
      expected/
```

See [world session](../place/world-session.md), [kinds.md](kinds.md), [unit-layout.md](../unit-layout.md).