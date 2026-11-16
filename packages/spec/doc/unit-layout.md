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

```text
catalog/story/examples/<story-id>/
  <story-id>.twin.yaml
  scenes/<scene-id>/
    run.yaml          # role: run — clock, runner, event copies
    expected/         # optional verify digest
```

`story.scenes[]` lists scene ids; use **`run: ./scenes/<scene-id>`** on each row when a `run.yaml` exists. Legacy **`beats`** loads as **`scenes`**.

Cross-type links use refs only (`links:`, `with:`, `copy: twinfile/<type>/<id>`).

Place nested interiors: **`parts/<id>/`** ([`PARTS.md`](../../../catalog/place/examples/PARTS.md)). Legacy **`scenarios/`** on sites → `yarn sync:story-scenes`.

Events and timetable modules: **`packages/simulator/`** (simulator registry) — operates on twin catalogs; **not** under `catalog/` and not twin heads.