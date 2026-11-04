# Controlled vocabulary

Use **one prose word per concept**. YAML and APIs keep stable field names; docs, comments, README, and UI copy use the terms below.

Canonical layers: [`packages/twinfile/src/catalog/place/examples/README.md`](../../src/catalog/place/examples/README.md#vocabulary-one-word-per-layer). Six published twin types: [kinds/kinds.md](kinds/kinds.md). Dockerfile model: [RFC 0009](../rfcs/0009-dockerfile-model/index.md), [Place recipe](place/place-recipe.md).

Say **place**, **resource**, **character**, **context**, **story**, **event** — never three-letter contract acronyms in prose.

## Quick reference (prose ↔ on-disk)

| Prose | On disk | One line |
| --- | --- | --- |
| **Place** | **`<unit>.twin.yaml`**, `kind: place` | Spatial twin → built **`Place`** |
| **Resource** | **`<unit>.twin.yaml`**, `kind: resource` | Equipment, material, product |
| **Character** | **`<unit>.twin.yaml`**, `kind: character` | Personnel; **`disclosure:`** required; body **`character.kind`**: **`narrative`** (cast/NPC) or **`persona`** (visitor/staff archetype) |
| **Context** | **`<unit>.twin.yaml`**, `kind: context` | JTBD pack — When [Context], I want to [Goal], so I can [Outcome] without [Obstacle]; story blesses character |
| **Story** | **`<unit>.twin.yaml`**, `kind: story` | Planned process — narrative; **player** input ([story-and-player](kinds/story-and-player.md)) |
| **Event** | **`<unit>.twin.yaml`**, `kind: event` | Phases, `expects` roles, `args`. Scenes **`copy: twinfile/event/<id>:<ver>`**; places host events through role tags |
| **Run** | **`story.scenes[].run`** (`<story-dir>#<scene-id>`) | Inline scene run: `from:`, `copy:`, `clock:`, `args:` — **not** a published twin; optional `use.runner` for offline only |
| **Runner** | `use.runner` | Offline **ENTRYPOINT** (`npm:` ref) for `twin run` — MCP / host supplies the analyst prompt; see [Runners](pack/runners.md) |
| **Session** | `clock:` + built **`Place`** (host) | **World time** at playhead `t`; precomputed **timeline** (`timeline.at(t)`). Not a catalog ref |
| **Player** | host runtime | Runs a **story** (`twinfile/story/<id>`), loads each scene's inline **`run:`**, advances **session** on the patch **module bus** |
| **`id`** | head field | Ref slug (`twinfile/<type>/<id>:<version>`) — never UI copy |
| **`name`** | head field | Display title |

Published twins live under **`catalog/<type>/examples/`** ([unit-layout](unit-layout.md)). **Runs** are inline **`run:`** blocks on story scenes only (`<story-dir>#<scene-id>`).

## Repository layout (prose)

| Term | Path | Role |
| --- | --- | --- |
| **Catalog hub** | `catalog/` | Six twin type workspaces |
| **Ref map** | `packages/twinfile/src/catalog/place/examples/` | `twin.local.yaml` (local refs) + `published-refs.json` (golden digests) — **not** normative spec |
| **Spec conf** | `packages/twinfile/spec/conf/` | Conformance vectors, role vocabulary, crosswalk — **not** twin ops |
| **Kernel** | `packages/{spec,core,cli,bridge}/` | Format, load/merge, CLI |
| **Player** | `packages/twinfile/src/simulator/` | Events, playback — operates on catalogs |

Ops env: **`TF_TWINFILE_ROOT`** → repo root, only needed outside the repo. Golden examples and `character/libs` derive from it under `packages/twinfile/src/catalog/`. Path API: [`catalog-layout.ts`](../../src/core/paths/catalog-layout.ts).

## Twinfile (the format)

**Twinfile** (prose) is the format name and CLI — not a single filename. Each **published twin** is a folder with one head, `<unit>/<unit>.twin.yaml`, typed by its `kind:`, and builds a type-specific artifact; **place** output is **`Place`** (`Place.data` + `Place.meta` + `Place.digest` in **`<unit>.twin.lock`** when lock write is on).

| Term | Meaning |
| --- | --- |
| **Twinfile** | The interchange format and tooling (`twin` CLI) |
| **Twin** | One published unit (`twinfile/<type>/<id>:<ver>`) |
| **Place** (build) | Output of `twin build` on a place unit |
| **Run** | Scene **`run:`** — compose `kind: scenario` for verify; not **`twinfile/event/`** |
| **Runner** | **`use.runner`** on a run — offline verify; prompts are MCP-only |
| **Event** | **`kind: event`** under `catalog/event/` — a timed occurrence a place hosts (hazards, game days) |

A **place does not run**. **Runs** + **player** execute on a built place (runner offline, player live).

## Views vs bridges vs host adapters

| Term | Role | Not |
| --- | --- | --- |
| **View** | One-way presentation of a twin (`TwinfileSummaryV1` → ascii/json/yaml/markdown; place → Schema.org **JSON-LD**; trees → **loro** pack JSON) | Round-trip class ↔ map I/O |
| **Loro map I/O** | Document `import`/`export` against a host-passed PackMap / LoroMap-like object (`importTwinfileFromLoroMap` / `exportTwinfileToLoroMap`) | Owning loro WASM or locker sync |
| **Bridge** | Authoring-time import/export of place layers (IMDF, GTFS, …) | Card/HTML rendering |
| **Host adapter** | Host runtime contracts (patch bus, map sink, locker) | Spec/kernel presentation |

Kernel API: `renderTwinfileSummaryView`, `renderTwinfilePlaceView` (`jsonld`), `renderTwinfileLoroView` (`loro` — LoroMap-safe JSON; no `loro.js` WASM in core); `@local-hosting/twinfile/loro` for map import/export. CLI: `twin summary`, `twin export jsonld`.

## Site stack (prose)

| Term | Use for | Not |
| --- | --- | --- |
| **Base** | Layout parent (`from: twinfile/base-*`). Archetype enum on **place**. | “archetype base”, “golden base” (say **base**); do not invent `base-park` per geotype |
| **Programme** | Reusable fiction without a map pin (`templates/place/*`). | “template” in new prose (folder name `templates/` is fine) |
| **Site** | Catalog twin under `places/`; workbench venue. | “instance”, “demo place”, “geo instance” |
| **Geotype** | Map POI slug → picks a **base** via axes. | A separate base name per slug |

YAML: `kind: place`, field `place.archetype` (base kind enum), `geotype.primary`.

**Extent `site`** (axis: multi-building polygon) ≠ catalog **site**. Write “extent **site**” or “**multi-building** extent” when the axis is meant.

**Resource** (hydrant, sign, …): not a site — model as `assets` on a parent site.

## Twin heads vs other artifacts

Each published twin tree has one typed head. **Runs** and **simulator catalog** modules are out of band.

| Artifact | Prose | Role |
| --- | --- | --- |
| **`<unit>/<unit>.twin.yaml`** | **Place**, **Resource**, **Character**, **Story**, or **Event** (by `kind:`) | Twin head |
| **`story.scenes[].run`** | **Run** (scene) | Inline on the story head — not published |

## Twin head (all types)

| Field | Role |
| --- | --- |
| **`kind`** | `place` \| `resource` \| `character` \| `context` \| `story` \| `event` (loaders default **place** for legacy heads) |
| **`twinfile`** | Format generation (`1` or `2`) |
| **`id`** | **Ref slug** — `twinfile/<type>/<id>:<version>`, lock keys, OCI segment |
| **`name`** | **Display name** — cards, workbench, catalog (when set) |
| **`tags`** | Optional **programme / interest** labels — `ns:slug` strings (e.g. `theme:climate-bio`, `district:opportunity`). Any twin kind MAY set them. **Not** JTBD (`kind: context`) and **not** place event-role hooks (`roles[]`) |
| **`use.runner`** | **Runs only** (scene `run:`) — **`npm:`** solver ref; analyst prompts are MCP-only (`test_prompt`), not twin YAML |

**`place.name`** in `steps` = site fiction on the map, not the published ref in **`id`**.

## World time (clock, timeline, player, runner)

One **timeline** is authoritative: scenario **`clock:`**, place **tracks** / **schedules** / **feeds**, core **`timeline.at(t)`** ([Time](place/time.md)).

| Prose | Role |
| --- | --- |
| **Session** | Built place + clock + current playhead `t` (scrub or live) |
| **Player** | Host loop that advances a **session** and publishes **`TwinMessageV1`** on the patch **module bus** (`signal:trigger`, `twin:event`, `signal:*`). **Play** = same controls as clicks, on a schedule |
| **Runner** | Offline verify step for CI. Default: subprocess stdin (`Place` + **timeline**) → stdout JSON Lines. **`use.runner`** pins the implementation; prompts come from the host MCP catalog |

**Consolidate at the session, not in YAML:** the **player** owns the clock step; a **runner** is a pluggable **answer step** (batch at end of run, or in-process for built-ins). Untrusted **`npm:`** runners stay subprocesses ([`gov/security.md`](gov/security.md)). Do not publish `twinfile/player` as a compose unit — player is host code; **`use.runner`** stays the manifest pin.

**`kind: event`** (catalog twin) ≠ the patch **module bus**. Say **module bus** or **patch bus**, not “event bus”, in new prose.

Live controls: [`pack/patch.md`](pack/patch.md) (**`Place.meta.placeType.controls`**). Offline answers: [`pack/runners.md`](pack/runners.md). Host alignment (product hosts, workbench): [`place/world-session.md`](place/world-session.md).

Normative JSON Schema: [`schemas/1/twinfile/twinfile.schema.json`](../schemas/1/twinfile/twinfile.schema.json) — Schema paths use `schemas/1/twinfile/`; prose says **Twinfile**.

## Compose (qualify overloaded words)

| Word | Prose usage |
| --- | --- |
| **Step** | One item in Twinfile `steps:` (`twinfile: 2`) |
| **Build layer** | One compose step (`twin layers`; not persisted on disk) |
| **Layer** | Avoid in authoring prose unless referring to build output or v1 `layers:` |

Verbs: **`from:`** (base), **`copy:`** (ref or `./path`) — no extra synonyms.

## Mode (always qualify)

| Context | Values |
| --- | --- |
| **Merge mode** | `patch` \| `replace` on layer merges |
| **Session layout** | `place` on timeline samples — hazard/recovery fiction via **event** phases and **`twin:event`** pulses (`@local-hosting/twinfile/simulator` world session), not manifest `mode:` |

## Visit moments (`visits[]`)

Optional **visit moments** in **`visits[]`** (v1 `place/visits.yaml`, v2 a `steps:` item): ordered beats bound to `space` ids (`visitMomentId` on each row). Use them for layout skim, cards, and tools like `twin layout summary`. **Not** end-user movement or persona routing — other projects own that on top of `Place.data` (`spaces`, `openings`, `routes`, roles).

## Event roles

Event `expects` keys and `roles[]` on place rows must be ids from **`spec/conf/role-vocabulary.yaml`** — extend that file first, then events and bindings.

## Refs

Published id patterns: [`pack/refs.md`](pack/refs.md). Say **ref** or **ref slug** (`id` on the Twinfile head), not “package name”, for `twinfile/<id>:<tag>`.

Operational env vars: **`TF_`** prefix, not `TWINFILE_` unless format-bound (`TWINFILE_MANIFEST_VERSION`, `@local-hosting/twinfile-*`).
