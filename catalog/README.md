# Twin catalog

Each twin type is one tree: **`catalog/<type>/`** = `@doppler-group/twinfile-<type>` workspace (`src/`, `test/`) plus **`examples/<id>/`** (and character YAML libs beside `examples/`).

| Kind | Twin examples | Other authored YAML |
| --- | --- | --- |
| place | `catalog/place/examples/<id>/` | — |
| resource | `catalog/resource/examples/<id>/` | — |
| character | `catalog/character/examples/<id>/` | `catalog/character/libs/{audience,journey,psychology}/` |
| story | `catalog/story/examples/<id>/` | — |

**Runs:** `catalog/story/examples/<story>/scenes/<scene>/run.yaml` only.

**Ref map and digests:** [`place/examples/twin.local.yaml`](place/examples/twin.local.yaml), [`place/examples/published-refs.json`](place/examples/published-refs.json). **Spec conf** (normative): `packages/spec/conf/`.

**Env:** `TF_TWINFILE_ROOT` only, when running from outside the repo. All catalog paths derive from the repo root.

## Simulator (not a catalog type)

**`@doppler-group/twinfile-simulator`** lives at **`packages/simulator/`**. It **operates on** the twin catalogs (built **place**, story **runs**, refs) via `resolveTypeExamplesRoot` — it does **not** live under `catalog/`. Situation and timetable modules use **`catalogKind: situation` | `event`** in the simulator registry, not typed twin heads.

**Path API (code):** `packages/core/src/paths/catalog-layout.ts` — `resolveTypeExamplesRoot`, `resolvePlaceExamplesCatalogRoot`, `resolveCharacterCatalogRoot`, `TWIN_CATALOG_HUB`.

See [unit-layout.md](../packages/spec/doc/unit-layout.md).