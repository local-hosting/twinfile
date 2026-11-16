# Archived venue YAML → Twinfile place units

**Status:** The old [`twinfile/vlm`](https://github.com/twinfile/vlm) GitHub repo is **archived** (read-only). Do not add dependencies on `@twinfile/vlm` npm.

The archived repo described one venue layout for product/story mounts. Twinfile 1 **place** units are the normative source; experience models should reference them with a **Twinfile ref** (`twinfile/shop:1.0.0` or pinned OCI digest).

Author new layout in **`examples`** `places/` (or your repo’s Twinfile units). Use the table below when hand-porting old venue YAML trees — there is no migrator in the toolchain.

## Field mapping

| Archived venue YAML | Twinfile **`place/`** layers (merged into **`Place.data`**) |
| --- | --- |
| `levels[].id` | `place/levels.yaml` → `levels[].id` |
| `spaces[].id`, `label` | `place/spaces.yaml` → `id`, `name` |
| `spaces[].levelId` | `spaces[].level` |
| `spaces[].role` | `spaces[].roles[]` (single role becomes one-element array) |
| `spaces[].areaSqM` | `spaces[].area_m2` |
| `pathways[]` | `place/routes.yaml` → `routes[]` (`kind` from pathway kind) |
| `fixtures[]` | `place/assets.yaml` or ops layers |
| `moments.yml` / visit beats | `place/visits.yaml` → `visits[]` |
| `layout.mode` | `place/place.yaml` → `place.archetype` |
| `layout.scale` | `place/place.yaml` → `place.authoring_scale` |
| `spaces[].order` (linear) | `spaces[].visit_order` |
| `venueKind` | manifest **`geotype.primary`** |
| `geo`, `h3` | `place/place.yaml` `footprint` / `ext` |

## Refs

- **Current:** `placeRef: twinfile/arena:1.2.0` on downstream story/scene mounts and optional org strategy lists. Resolve with **`@local-hosting/twinfile-core`** **`resolvePlaceMount`** (or **`resolveExamplePlace`** for examples) and embed **`placeMount`** on host packs. SAM scenes and `sam.places` bind by **`placeRef`**, matched on kind + name (tag ignored; a kindless ref counts as `place`) with **`samePlaceRef`**.

See [Refs](../pack/refs.md).
