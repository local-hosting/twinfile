# Layers

**Compose layer order** (what `twin build` runs): **place** → each scenario **`steps` `copy`** event (+ plan roles layer) → each situation → scenario patch steps → resolved args. See [RFC 0001](../../rfcs/0001-five-layers.md).

For **`from:`**, **`steps:`** (`copy:`, `plan:`), v1 **`with:`** / **`layers:`**, and the canonical compose order, see [Composition](composition.md#authoring-compose-order-canonical).

**Place `from:`** (optional): twinfile ref to a base **place** unit. Base **`layers`** merge first; this unit’s **`layers`** merge on top (same rules as multi-file **`place/`**). Plan paths live in **`layers:`** as `plans/*.yaml`; legacy top-level **`plans:`** is normalized by **`twin fmt`**.

Merge: RFC 7396 on objects; id-array merge by `id`; other arrays replace.

**Docker stack:** compose runs in order (`from:` base → `with:` mixins → your `layers:`). Each step merges on top of the previous result — like image layers. Golden **`from:`** bases ship **contract only** (`place.archetype`, `authoring_scale`, default `levels`); your **`layers:`** are the `COPY` steps that define topology. Child rows **add or override by `id`**; they do not need `$delete` when the base never defined those ids.

**Build history vs visit moments:** each compose step is one **build layer** (`twin layers`, workbench **Build history**). A step whose key is `visits` adds **visit moments** ([glossary](../glossary.md#visit-moments-visits)) — optional layout TOC rows, not end-user movement (hosts own routing on `spaces` / `openings` / `routes`).

**Fine patches:** multiple files on **one** unit (`spaces-zones.yaml` then `spaces-rooms.yaml`) use the same id-merge. **`mode: replace`** on a layer entry replaces whole collections in that file (Docker `COPY` over a directory). To drop a row from an earlier file on the **same** unit, patch `{ id: <same>, $delete: true }` (rare).

**Authoring stack:** list `plans/<situation>.yaml` in **`layers:`** after place files (or run **`twin fmt`** to lift legacy **`plans:`**).

Errors: `E_NO_PLAN`, `E_ROLE_MISSING`, `E_ROLE_KIND`, `E_ROLE_REF`, `E_ROLE_MIN`, `E_ROLE_VOCAB`, `E_ROLE_TAG`, `E_TIMETABLE_REF`.

Composition errors ([RFC 0004](../../rfcs/0004-composed-bases.md)): `E_MIXIN` (mixin patches `place`), `E_MIXIN_CONFLICT`, `E_MIXIN_AXES` (`applies_to`), `E_ARCHETYPE_AXES` (incomplete or invalid axes), `E_ARCHETYPE_AXES_MISMATCH`.
