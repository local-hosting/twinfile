# Twin unit layout

Type package skeleton (symmetric `src/`): [type-package-layout.md](type-package-layout.md).

## Four twin roots

Every twin under `catalog/<type>/examples/<id>/` shares:

- `<Type>.yaml` (required)
- `README.md` (required)
- `steps/`, `parts/<id>/` (place), `sources/`, `expected/`, `docs/`, `ext/` (optional)

| Type | Root | Example id |
| --- | --- | --- |
| place | `catalog/place/examples/<id>/` | `shop`, `arena` |
| resource | `catalog/resource/examples/<id>/` | `greeter-kiosk` |
| character | `catalog/character/examples/<id>/` | `shop-greeter` |
| story | `catalog/story/examples/<id>/` | `shop-visit` |

## Story scenes (runs, not twins)

```yaml
# catalog/story/examples/<story-id>/<story-id>.twin.yaml
links:
  - rel: involves
    href: twinfile/place/shop:0.2.0
story:
  scenes:
    - id: shop-shelter-at-cap
      label: Shelter at capacity
      run:                      # optional — makes the scene runnable
        # from: defaults to the story's single involves place
        steps:
          - copy: twinfile/event/severe-weather:1.0.0
        clock: { starts_at: 2026-06-12T18:00:00-07:00, duration: PT30M, step: PT5M }
        args: { occupancy: 180 }
```

Each scene's **`run:`** is an inline mapping (`from?`, `steps`, `clock`, `schedule`, `args`, optional `use.runner` for offline `twin run`). **`from:`** defaults to the story's single **`links` `involves` place** ref; set it only to override. Address a scene as **`<story-dir>#<scene-id>`** (`twin run catalog/story/examples/shop-visit#shop-shelter-at-cap`). A string `run:` (old scene folder) fails to load. Legacy **`beats`** loads as **`scenes`**.

Cross-type links use refs only (`links:`, `copy: twinfile/<type>/<id>`).

Place nested interiors: **`parts/<id>/`** ([`PARTS.md`](../../../catalog/place/examples/PARTS.md)).

Events and timetable modules: **`packages/simulator/`** (simulator registry) — operates on twin catalogs; **not** under `catalog/` and not twin heads.