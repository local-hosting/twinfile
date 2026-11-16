# @doppler-group/twinfile-simulator

**Playback runtime** for built **place** twins and story **runs** from the monorepo **`catalog/`** tree — not a fifth catalog type.

Catalogs resolve from the repo root (`catalog/place/examples`, `packages/simulator`). Outside the repo, set `TF_TWINFILE_ROOT`:

```bash
export TF_TWINFILE_ROOT=/path/to/twinfile
twin build catalog/place/examples/shop
```

`@doppler-group/twinfile-core` merges **`catalog/place/examples/twin.local.yaml`** and **`simulator/twin.local.yaml`** for ref resolution. Compose and player bind **situations** (`copy: twinfile/situation/...`) from the simulator registry to **hosts** resolved from the place catalog.

| Package | Role |
| --- | --- |
| **`@doppler-group/twinfile-core`** | Load/build twins; `catalog/` path layout; ref resolve |
| **`catalog/{place,resource,character,story}/`** | Golden twin heads + character YAML libs |
| **`@doppler-group/twinfile-simulator`** | Timeline, session bus, **situation/event** registry (`events.registry.json`) |

Normative **format** (roles, `markers`, phases, plans) stays in **`@doppler-group/twinfile-spec`**.

Workbench: [`viewer/README.md`](viewer/README.md) (`yarn workbench`).

## Layout

```text
packages/simulator/
  src/timeline/         Session playback
  src/catalog/builtin/  PlaceEvent modules
  events.registry.json  compose metadata for situation refs
  mixins/               kind: mixin (with:)
  situations/           prebuilt situation images (`.twin/`)
  twin.local.yaml       dev ref map
```


Places and bases live in **`catalog/place/examples/`**.