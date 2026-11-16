# @doppler-group/twinfile-simulator

**Playback runtime** for built **place** twins and story **runs** from the monorepo **`catalog/`** tree — not a fifth catalog type.

| Root | Path |
| --- | --- |
| Twin catalogs (place default) | `TF_EXAMPLES_ROOT` → `catalog/place/examples` |
| This package | `TF_SIMULATOR_ROOT` → `packages/simulator` |

```bash
export TF_TWINFILE_ROOT=/path/to/twinfile
export TF_EXAMPLES_ROOT=$TF_TWINFILE_ROOT/catalog/place/examples
export TF_SIMULATOR_ROOT=$TF_TWINFILE_ROOT/packages/simulator
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
  situations/           situation Twinfile heads (sync → builtin)
  twin.local.yaml       dev ref map
```

Regenerate builtin modules: `yarn workspace @doppler-group/twinfile-simulator sync:events`.

Places and bases live in **`catalog/place/examples/`**.