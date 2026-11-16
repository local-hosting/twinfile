# RFC 0009 — Twinfile as Dockerfile (Twinfile 2)

Status: Draft
Created: 2026-11-10
Supersedes: [RFC 0005](../0005-build-imports.md) for **`twinfile: 2`** units

## Summary

`Twinfile.yaml` is a **Dockerfile**. It names one parent image (**`from:`**) and an ordered list of **steps** (**`steps:`**). `twin build` executes each step on top of the parent image in order; **each step produces exactly one content-addressed layer**. The same steps + parent digest MUST yield the same **`Place.digest`** (deterministic build). The built result is an **image** (`Place.data` + layer chain + digest).

Authors write **steps**. Tooling produces **layers**. The manifest no longer has a field called `layers:` on v2 place units.

Optional **`processors:`** (RFC 0007) declares host module wiring beside the image build; it does not participate in `Place.data` merge or `Place.digest`.

## Docker mapping

| Dockerfile | Twinfile 2 | Notes |
| --- | --- | --- |
| Dockerfile | `Twinfile.yaml` | One file defines the unit |
| `FROM base:tag` | `from: twinfile/base-campus:0.1.0` | Exactly one parent; must be a built **place** image |
| Instruction (`RUN`, `COPY`, …) | One item in `steps:` | Order is the deterministic build order |
| Layer | Output of one `steps[]` item | Content-addressed diff; never authored directly |
| Parent image layers | Parent's built layer chain | Inherited as-is; child cannot edit them |
| Whiteout file (delete in upper layer) | `{ id: x, $delete: true }` in a data step | Removes a row from a lower layer |
| `COPY --from=<image>` | `- copy: ./parts/terminal-a` in `steps:` | Pulls another unit's built content in **at that position** |
| Build cache | Layer cache keyed by parent chain digest + instruction digest | Edit instruction *i* → rebuild layers *i…n* only |
| Image digest | `Place.digest` | Pinned in `Twinfile.lock` |
| `docker history` | `twin layers` | Parent layers first, then this unit's |
| `ARG` | `args:` (scenario) | Unchanged |
| `ENTRYPOINT` | `use.runner` (scenario) | Unchanged |

## Inheritance: parent layers come through

`from:` does **not** re-run the parent's `steps:`. It resolves the parent to its **built image** (pinned by digest in `Twinfile.lock`) and stacks the child's layers on top — the same way `FROM node:20` reuses node's layers without reading node's Dockerfile.

```text
FROM twinfile/base-campus:0.1.0       base-campus image
  layer  from/base-campus/0            (base-campus step 0)   ← inherited, read-only
  layer  from/base-campus/1            (base-campus step 1)   ← inherited, read-only
STEP   place: { name: Airport, … }
  layer  0                                                     ← this unit
STEP   spaces: [ … ]
  layer  1
COPY   ./parts/terminal-a
  layer  2
PLAN   for: transit-disruption
  layer  3
                                       ⇒ built Place (`Place.digest`)
```

Consequences:

- If the parent itself has a `from:`, its whole chain is already inside its image. The child never walks grandparents.
- Changing a parent requires rebuilding the parent and bumping the child's lock — exactly like re-pulling a base image.
- A child overrides parent rows **only** by adding a later layer (id-merge wins, `$delete` whiteouts). It never rewrites a parent layer.

## Manifest

```yaml
twinfile: 2
kind: place
from: twinfile/base-campus:0.1.0
name: airport
version: 0.3.0
geotype:
  primary: airport
  registry: "@doppler-group/geotypes@0.2.0"
steps:
  - place:
      name: Airport
      kind: airport
      timezone: America/New_York
      ext: { lat: 40.6438, lon: -73.782, h3: 892a103b1cbffff }
  - levels:
      - { id: ground, name: Ground }
      - { id: airside, name: Airside }
  - spaces:
      - { id: terminal-a, name: Terminal A, kind: terminal, level: ground, capacity: 5000 }
  - copy: ./parts/terminal-a
    into: terminal-a
  - plan:
      for: transit-disruption
      roles: { … }
```

### Instruction kinds

Every `steps[]` item is exactly one of:

| Instruction | Shape | Layer it produces |
| --- | --- | --- |
| **Data** | Object with place collection keys (`place`, `levels`, `spaces`, `openings`, `routes`, `assets`, `markers`, `schedules`, `visits`, …) and optional `mode: replace` | RFC 7396 merge; id-arrays merge by `id`; `mode: replace` replaces the named collections |
| **Plan** | `{ plan: { for: <event>, roles: … } }` | Compose layer `plan/<for>` in history; **built image** stores docs under `Place.data.eventBindings` (keyed by event id), not a top-level `plans` map on the image |
| **Copy** | `{ copy: <ref or ./path>, into?: <space id>, prefix?: <string> }` | The referenced place unit's **built** content |

**Copy semantics (place source).** The source is built in full (its own `from:` and `steps:`). Its `place` metadata and `levels` are dropped: the copying unit owns site identity and the level table. Every copied id gets `prefix`, and references to copied ids (`parent`, `space`, `from`, `to`, …) are rewritten to match. With `into:`, an earlier instruction MUST declare that space, the default `prefix` is `<into>-`, and copied rows with no `parent` get `parent: <into>`. Without `into:`, ids are unprefixed unless `prefix` is set.

`copy:` replaces `buildings:` / `floors:` (place imports under an anchor). Order is whatever the author writes, like `COPY --from` in a Dockerfile.

### Buildings and floors are their own Twinfiles

A building or floor that has its own identity stays a **separate Twinfile**, nested under the unit that uses it and copied in by relative path (Docker multi-stage within one build context):

```text
places/airport/
  Twinfile.yaml                         # campus: from base-campus, copies terminal-a
  parts/terminal-a/
    Twinfile.yaml                       # building: from base-indoor-stack, copies its floors
    floors/airside/Twinfile.yaml        # floor
```

```yaml
# places/airport/Twinfile.yaml
steps:
  - spaces: [ { id: terminal-a, name: Terminal A, kind: terminal, level: ground } ]
  - copy: ./parts/terminal-a
    into: terminal-a

# places/airport/parts/terminal-a/Twinfile.yaml
from: twinfile/base-indoor-stack:0.1.0
steps:
  - spaces: [ { id: concourse, … }, { id: security-hall, … } ]
  - copy: ./floors/airside
    prefix: airside-
```

| Ref form | Resolves to |
| --- | --- |
| `./path` | Nested unit in the same tree; built as a stage of this build; not published or listed on its own |
| `twinfile/name:tag` | Published image from a registry (reuse across sites) |

Prefixes compose: the floor's `hold-room` is `airside-hold-room` in the building and `terminal-a-airside-hold-room` (parent `terminal-a`) on the campus.

Nested units live under `parts/` or `floors/`; publish and catalog walkers skip those directories. A nested building can be built and tested by itself (`twin build places/airport/parts/terminal-a`), and can be promoted to a published ref later without changing its contents. Catalogs list only root units; nested stages appear under their parent.

### Forbidden on v2 place units

`layers:`, `with:`, `buildings:`, `floors:`, `plans:`, and legacy `patches:` / `patch:` (use `twin fmt`).

## Scenario units

A scenario is a Dockerfile whose `FROM` is a built `Place`:

```yaml
twinfile: 2
kind: scenario
from: ..                     # parent `Place`
steps:
  - copy: twinfile/severe-weather:1.0.0     # event
  - copy: twinfile/home-game:1.0.0          # event
  - spaces: [ { id: gym, state: { shelter: open } } ]
args: { … }                  # ARG
use: { runner: … }           # ENTRYPOINT
```

RFC 0001's place → event → scenario → args order becomes **step order in the scenario's `steps:`**, not a separate “five layers” concept. Prose calls those **stages**, never layers.

## Terminology (normative for docs and UI)

| Use | For |
| --- | --- |
| **Twinfile** | The place recipe (`Twinfile.yaml` — Dockerfile for the site image) |
| **Step** | One authored `steps[]` item (data, `plan:`, or `copy:`) |
| **Layer** | Build output of one step (`twin layers`, workbench “Layers” tab) |
| **Processor** | One module instance in `processors:` (RFC 0007; not a build step) |
| **Image** | Built unit: `Place.data` + layer chain + `Place.digest` |
| **Parent image** | Built result of `from:` |

Do not use “layer” for authored content.

## Migration from v1

`twin fmt --upgrade=2 [dir]`:

1. Inline each v1 `layers:` file as one step, preserving order and `mode`.
2. Reject a manifest that still declares `with:` (mixins were withdrawn; put their rows in the place or its base).
3. Rewrite each `buildings[]` entry as `{ copy: <from>, into: <id> }` (keeping `prefix`), placed **after** the unit's own steps (v1 order). Entries with `floors:` are rejected: move the floor into the building's own Twinfile and copy it there.
4. Rewrite v1 plan files as `plan:` steps after the place steps.
5. Set `twinfile: 2`; drop `layers:`, `buildings:`, `plans:`; delete the inlined files.

`ext/layout-index.yaml` `detail_layers` entries on v2 units name collection keys (`spaces`) instead of file paths.

v1 builds and v2 builds of the same content MUST produce the same `Place.data`. Layer refs and digests change.

## Conformance

- Schema: v2 `placeManifest` requires `steps` (data, `plan:`, or `copy:` objects) and forbids the v1 fields above; v1 units forbid `steps` and `buildings`.
- Status: `@doppler-group/twinfile-core` currently composes the parent chain from source on each build rather than reading a pinned parent image; the resulting `Place.data` is the same.
- Vectors: v1 → v2 upgrade produces an identical `Place.data` for every example.
- Cache: rebuilding with an unchanged parent digest and unchanged instructions *0…i* reuses layers *0…i*.

## Alternatives considered

- **`steps:` as file paths** — rejected; the manifest becomes a table of contents, not the definition.
- **Keep `buildings:` as a separate field** — rejected; Docker has one ordered instruction list, and position matters.
- **Re-run the parent's instructions on each child build** — rejected; breaks image immutability and the cache model.
