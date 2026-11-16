# Composition (Docker mental model)

A **place recipe** builds a **`Place`**; a **scenario run** stacks stage layers on that build ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md), [RFC 0001](../../rfcs/0001-five-layers.md)). This page separates **three** composition mechanisms that all show up as “layers” in tooling.

## Terminology

| Term | Meaning |
| --- | --- |
| **Place build steps** | Items in Twinfile **`steps:`** (`twinfile: 2`) or paths in **`layers:`** (`twinfile: 1`), merged in list order (coarse → fine). A **`from:`** base's layers come first. |
| **Compose layers** | Steps **`twin build`** runs: place layer patches, then (on scenario runs) events, plan roles, scenario patches, resolved **`args:`**. |
| **Base** | A published place recipe with **no** **`from:`** — map-shape skeleton (`place.archetype`, default files under **`place/`**). Example: `twinfile/base-campus:0.1.0`. |

## Authoring compose order (canonical)

On a **place** recipe, **`twin build`** and **`twin layers`** apply steps in this order. Other spec pages link here instead of repeating the table.

| Step | Twinfile | Role |
| --- | --- | --- |
| 1 | **`from:`** | Golden base place (`FROM`): its built layers (archetype, authoring scale, default `levels`) come through read-only |
| 2 | **`steps:`** (`twinfile: 2`) | One instruction per item, in list order; each builds one layer. Inline patch (`spaces:`, `openings:`, …), **`plan:`**, or **`copy:`** — a mixin ref, or a nested building/floor by `./path` with optional `into:` / `prefix:` ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)) |
| 2′ | **`with:`** then **`layers:`** (`twinfile: 1`) | Mixins ([RFC 0004](../../rfcs/0004-composed-bases.md)), then `place/` files and **`bindings/<event>.yaml`** in list order |

Later patches win for the same `id`. A `copy:` with `into:` needs the anchor space declared by an earlier patch. Convert v1 with **`twin fmt --upgrade=2`** (`with:` becomes leading copies; `buildings:` is gone). **Editor stack expansion:** `with:` mixins and `copy: ./…` stages open in the composed buffer; **`from:`** stays a ref on the place recipe (like a pinned parent image).

Id-array merge rules and **`$delete`**: [Layers](layers.md).

## Docker mapping

| Docker | Twinfile (authoring) | Twinfile (build output) |
| --- | --- | --- |
| Dockerfile | `<unit>.twin.yaml` + `place/` + `steps: - plan:` | — |
| `FROM` | **`from:`** on a **place** (or **`from: ..`** on a **scenario**) | Base unit ref in provenance |
| `COPY` / patch steps | Manifest **`layers:`** / **`steps:`** — place patches and inline **`plan:`** (legacy `bindings/*.yaml` lifted by `twin fmt`) | **`place`** compose layers; bindings end on **`Place.data.eventBindings`** |
| `COPY --from=<stage>` | **`with:`** mixin units (`kind: mixin`), applied after **`from:`** and before local **`layers:`** ([RFC 0004](../../rfcs/0004-composed-bases.md)) | **`mixin`** compose layers with refs like `with/mixin-assets/place/assets.yaml` |
| `COPY --from=<stage>` (local stage) | **`copy: ./parts/<name>`** (and `./floors/<floor>` inside a building), nested Twinfiles under the campus ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)) | **`copy`** compose layers under `copy/<into>/…` |
| Shared dependency image | **Event** / **event** units linked by **`bindings/`** (`for:` target name) | `event`, `event`, `plan` compose layers |
| `ARG` | **`args:`** on scenarios | `args` compose layer |
| `ENTRYPOINT` | **`use.runner`** | Offline runner (`twin run`); host **player** is not manifest — [World session](../place/world-session.md) |
| `docker history` | — | **`twin layers`** (in-memory layer list) |
| Image digest | — | **`Place.digest`**, **`<unit>.twin.lock`** layer chain |
| Registry | — | OCI artifacts (`oci:…`, `twin push` / `twin pull`) |

Normalize manifest keys and order **`bindings/`** after place layers: `twin fmt [path]` (unit dir, manifest file, or tree with **`--recursive`**).

Normative merge rules: [Layers](layers.md). Authoring order: [Layout navigation](../place/layout-navigation.md). **Step-by-step place declaration:** [Place recipe](../place/place-recipe.md).

**Compose vs patch:** compose steps produce **`Place.data`** with implicit merge (no per-file ports). Optional manifest **`processors:`** declares **module ports and wires** for hosts — [Patch graph](../pack/patch.md).

## Place authoring recipe

Write manifests top-to-bottom like a Dockerfile.

**Derived place** (golden base + patches) — example shop:

```yaml
from: twinfile/base-indoor-stack:0.1.0
twinfile: 1
kind: place
name: shop
version: 0.2.0
stability: example
geotype:
  primary: shopping_mall
  registry: "@local-hosting/geotypes@0.1.2"
layers:
  - place/place.yaml
  - path: place/spaces.yaml
    mode: replace
  - place/openings.yaml
  # … routes, assets, bindings/*.yaml …
```

**Campus + nested building** (`twinfile: 2`) — site patches, then a copy of the building Twinfile under `parts/`. Pattern guide: [Campus → building → floor](../place/campus-building-floor.md). Examples: [`transit-hub-campus`](../../../../catalog/place/examples/mobility-hub/campus/), [`airport`](../../../../catalog/place/examples/airport/) (building copies `./floors/airside`), [`arena`](../../../../catalog/place/examples/arena/).

```yaml
from: twinfile/base-campus:0.1.0
twinfile: 2
kind: place
name: transit-hub-campus
version: 0.1.0
stability: example
geotype:
  primary: university
  registry: "@local-hosting/geotypes@0.1.2"
steps:
  - place: { name: Mobility hub campus, kind: mobility_hub, timezone: America/New_York }
  - spaces:
      - { id: transit-hub, kind: transit }
      # …
  - plan: { for: transit-disruption, … }
  - copy: ./parts/transit-hub
    into: transit-hub
```

Conventions:

1. **Pick a base by map-first `place.archetype`**, not by geotype slug or story name (`campus`, `indoor_stack`, `linear`, `single_level`). See [Place recipe](../place/place-recipe.md) (two-question → archetype table).
2. **`@local-hosting/geotypes`** publishes a **place scaffold** per slug (`placeScaffoldForSlug`): default **`archetype`** and **`authoring_scale`** — `twin init` sets **`from:`** to the matching **`base-*`** under `examples/`.
3. **Prefer one hop**: child → base. Deeper **`from:`** chains are allowed but harder to review.
4. **Root bases** live under `examples/` (or your registry); they declare **no** **`from:`**.
5. **Plan paths** live in **`layers:`** as `bindings/<event>.yaml` (after the place files). Mixin plan layers union with the child stack; nearest place unit wins on duplicate event names.
6. **Events stay separate units** — plans bind roles; scenario build pulls event layers in compose order.
7. **Decorate with `with:` mixins**, not copies: each golden event mixin brings role-tagged rows plus a wired plan; **`axes:`** narrows axes the base leaves open. Two mixins MUST NOT define the same row id, plan file, or axis unless the child resolves it ([RFC 0004](../../rfcs/0004-composed-bases.md)).
8. **Thin stack**: **`from:`** is the dependency (`FROM` / `package.json`) — archetype, scale, optional `levels` only. Your **`layers:`** stack on top and define spaces, openings, and the rest (`COPY`). Later steps override earlier ones for the same `id`; bases must not ship demo topology you would have to “uninstall.” Event role hooks come from **`with:`** mixins or your own `spaces` / `bindings/` ([Layers](layers.md)).

**Decorate** with shared bases, events, and place layer modules: [Decorate a twin](../place/decorate-twin.md).

## What `twin build` records

For a place unit, **`twin build`** merges patches, validates contracts, and returns a **`Place`** in memory (see [Built Place](built-place.md)). **`<unit>.twin.lock`** pins twinfile, tree, and layer **chain** digests when lock write is enabled.

Inspect layers without a separate on-disk artifact:

```bash
twin layers path/to/unit
twin layers path/to/unit --json
```

Scenario builds extend the stack: **place** → events → events → scenario patches → **`args:`** (see [RFC 0001](../../rfcs/0001-five-layers.md)).

## OCI

**`twin pack`**, **`twin push`**, pinned refs `oci:…@sha256:…`. See [Refs](../pack/refs.md) and [Built Place](built-place.md) and [Refs](../pack/refs.md).
