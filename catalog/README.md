# Twin catalog

Each twin type is one tree: **`catalog/<type>/`** = `@local-hosting/twinfile-<type>` workspace (`src/`, `test/`) plus **`examples/<id>/`** (and character YAML libs beside `examples/`).

**Browser:** character, story, and context ship a Node-free browser surface. Vite/webpack with the `browser` condition resolve the main entry to it (`./character`, `./narrative`, `@local-hosting/twinfile-context`). Explicit subpaths remain: `…/character/browser`, `…/narrative/browser`, `…/browser`. Disk loaders stay on the Node default entry.

| Kind | Twin examples | Other authored YAML |
| --- | --- | --- |
| place | `catalog/place/examples/<id>/` | — |
| resource | `catalog/resource/examples/<id>/` | — |
| character | `catalog/character/examples/<id>/` | `catalog/character/libs/{audience,journey,psychology}/` |
| context | `catalog/context/examples/<id>/` | `catalog/context/libs/jtbd/` — JTBD: context → goal → outcome |
| story | `catalog/story/examples/<id>/` | — |

**Runs:** inline `run:` on `story.scenes[]` in `catalog/story/examples/<story>/<story>.twin.yaml` only.

**Mode:** tag story and event examples with `mode: daily` or `mode: resilience` (same enum). Keep those modes in separate story units — see [`story/examples/README.md`](story/examples/README.md) and [`event/README.md`](event/README.md).

**Ref map and digests:** [`place/examples/twin.local.yaml`](place/examples/twin.local.yaml), [`place/examples/published-refs.json`](place/examples/published-refs.json). **Spec conf** (normative): `packages/spec/conf/`.

**Env:** `TF_TWINFILE_ROOT` only, when running from outside the repo. All catalog paths derive from the repo root.

## Simulator (not a catalog type)

**`@local-hosting/twinfile-simulator`** lives at **`packages/simulator/`**. It **operates on** the twin catalogs (built **place**, story **runs**, refs) via `resolveTypeExamplesRoot` — it does **not** live under `catalog/`. Event and timetable modules use **`catalogKind: event` | `event`** in the simulator registry, not typed twin heads.

**Path API (code):** `packages/core/src/paths/catalog-layout.ts` — `resolveTypeExamplesRoot`, `resolvePlaceExamplesCatalogRoot`, `resolveCharacterCatalogRoot`, `TWIN_CATALOG_HUB`.

See [unit-layout.md](../packages/spec/doc/unit-layout.md).