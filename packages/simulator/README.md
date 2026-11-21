# @local-hosting/twinfile-simulator

**Playback runtime** for built **place** twins and story **runs** from the monorepo **`catalog/`** tree — not a fifth catalog type.

Catalogs resolve from the repo root (`catalog/place/examples`, `packages/simulator`). Outside the repo, set `TF_TWINFILE_ROOT`:

```bash
export TF_TWINFILE_ROOT=/path/to/twinfile
twin build catalog/place/examples/shop
```

Scenes copy **events** (`copy: twinfile/event/...`) from [`catalog/event/examples/`](../../catalog/event/examples/) onto **hosts** resolved from the place catalog. Each expected role is filled from the place's role tags unless the place ships `bindings/<event>.yaml`. The scene `schedule:` sets when each phase starts.

| Package | Role |
| --- | --- |
| **`@local-hosting/twinfile-core`** | Load/build twins; `catalog/` path layout; ref resolve |
| **`catalog/{place,resource,character,story,event}/`** | Golden twin heads + character YAML libs |
| **`@local-hosting/twinfile-simulator`** | Timeline, session bus, event catalog; **`buildStoryScene`** / **`createTwinfilePlayerFromStory`** orchestrate core + place (compose is not here) |

Normative **format** (roles, `markers`, phases, plans) stays in **`@local-hosting/twinfile`**.

Workbench: [`viewer/README.md`](viewer/README.md) (`yarn workbench`).

## Layout

```text
packages/simulator/
  src/timeline/         Session playback
  src/catalog/          Event catalog (loads catalog/event units)
  viewer/               Workbench
```


Places and bases live in **`catalog/place/examples/`**.