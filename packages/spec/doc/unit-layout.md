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
story:
  scenes:
    - id: shop-shelter-at-cap
      label: Shelter at capacity
      run:                      # optional — makes the scene runnable
        from: twinfile/place/shop:0.2.0
        steps:
          - copy: twinfile/event/severe-weather:1.0.0
        clock: { starts_at: 2026-06-12T18:00:00-07:00, duration: PT30M, step: PT5M }
        args: { occupancy: 180 }
        use: { runner: npm:@twinfile/runner-hydraulic@^0 }
        expected:               # optional — what `twin verify` pins
          digest: sha256:…
          metrics: { time_to_shelter_s: 27 }
```

Each scene's **`run:`** is an inline mapping (`from`, `steps`, `domains`, `clock`, `schedule`, `args`, `use`, `expected`). Address a scene as **`<story-dir>#<scene-id>`** (`twin run catalog/story/examples/shop-visit#shop-shelter-at-cap`); run output goes to `<story-dir>/runs/`. A string `run:` (old scene folder) fails to load. Legacy **`beats`** loads as **`scenes`**.

Cross-type links use refs only (`links:`, `copy: twinfile/<type>/<id>`).

Place nested interiors: **`parts/<id>/`** ([`PARTS.md`](../../../catalog/place/examples/PARTS.md)).

Events and timetable modules: **`packages/simulator/`** (simulator registry) — operates on twin catalogs; **not** under `catalog/` and not twin heads.