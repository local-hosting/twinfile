## Unreleased

- **Breaking (draft):** [RFC 0009](rfcs/0009-dockerfile-model/index.md) — v2 place **`steps:`** deterministic image build; [RFC 0007](rfcs/0007-patch-graph.md) **`processors:`** / **`outlets:`** wiring; **`twin fmt`** drops legacy `patches:`, `patch:`, and split `inputs`/`outputs`/`connections`
- **Simulator catalog (`simulator/`)** — shared **situation** units and hazard **mixins** moved out of `examples/` into **`@local-hosting/twinfile-simulator`**; place demos and non-hazard mixins stay under `examples/`. Tooling and CI set **`TF_SIMULATOR_ROOT`** alongside **`TF_EXAMPLES_ROOT`**; `@local-hosting/twinfile-core` merges `examples/twin.local.yaml` + `simulator/twin.local.yaml` and resolves situation refs from the simulator tree ([`simulator/README.md`](../simulator/README.md))
- **`twin init place --geotype`** and strict checks load situations from the simulator catalog; plan `for:` names resolve via unversioned `twinfile/<situation>` refs
- New situation **`recovery-resilience`** and matching hazard mixin; yard **`staging`** role (spaces + `markers`) for recovery fiction
- **Breaking:** place layer **`access_points`** renamed to **`markers`** (`place/markers.yaml`); situation role kind **`access-point`** renamed to **`marker`**; schedule `uses.marker` replaces `uses.access_point` ([migration](doc/migration/ap-to-markers.md))
- [RFC 0005](rfcs/0005-build-imports.md): campus manifest **`buildings:`** and nested **`floors:`** import published place units into the site graph (`building` / `floor` compose provenance); schema on `placeManifest`
- **Golden bases are contract-only** — `from:` bases ship `place.yaml` (and `levels` when needed), not demo spaces/openings/plans; child `layers:` stack topology Docker-style ([Composition](doc/build/composition.md))
- **Unified manifest stack** — `plans/*.yaml` paths belong in `layers:` (legacy `plans:` merged by **`twin fmt`**); optional `{ path, mode: replace }` entries for whole-collection COPY ([Layers](doc/build/layers.md))
- **CLI:** `twin fmt [path] [--recursive]` normalizes manifest key order (`from` → `with` → head → `layers`) and merges `plans:` into `layers:`; accepts conf fixture filenames, not only `Twinfile.yaml`
- **Examples:** campus places demonstrate **`buildings:`** (airport, transit-hub, expo, arena, port, coliving); **`examples/README.md`** catalog table; **`push-example-units`** and **`published-refs`** walk all nested units
- **Geotypes:** **`suggest_building_import`** per archetype in `place-archetype-rules.yml`; init **`place/BUILDINGS.md`** when `suggestBuildingImportForSlug` is true (campus today)
- Docs: canonical [compose order](doc/build/composition.md#authoring-compose-order-canonical); legacy **`plans:`** wording removed from author guides
- **Place archetype axes** — [Place archetypes](doc/place/place-archetypes.md): each archetype is a named combination of **extent** (`footprint` · `site` · `area` · `route`), **vertical** (`flat` · `stacked`), and **movement** (`free` · `sequenced`); load-time rules key off the axes
- New `place.archetype` value **`open_area`** (golden base `twinfile/base-open-area:0.1.0`); it requires `place.footprint` or `place.ext` lat/lon
- **Breaking:** removed the **`network`** extent and archetype and golden base `twinfile/base-network:0.1.0`. A rail yard is `linear`; an intermodal facility is `campus`
- **Geotype decorations** — each registry slug suggests **`situations`** and decoration **`layers`** ([Place archetypes](doc/place/place-archetypes.md#decorations)); `twin init place --geotype` applies them on the golden base ([Decorate a twin](doc/place/decorate-twin.md#geotype-decorations))
- Situation role hooks come from **`with:`** mixins or place `layers:`; optional scaffold fixture at `examples/fixtures/plan-scaffold-campus/`
- **Assets are not places** — point assets without an interior (signs, traffic lights, hydrants, poles, meters, towers, wells) are listed under `assets:` in the geotype rules and are rejected by `twin init place`; model them as `assets.yaml` rows ([Place archetypes](doc/place/place-archetypes.md#assets-are-not-places))
- [RFC 0004](rfcs/0004-composed-bases.md): `axes:` on place manifests and ordered `with:` mixin units (`kind: mixin`, new `mixinUnit` schema with `applies_to` / `provides`) for composable decorations; new conformance category `compose`; error codes `E_MIXIN`, `E_MIXIN_CONFLICT`, `E_MIXIN_AXES`, `E_ARCHETYPE_AXES`, `E_ARCHETYPE_AXES_MISMATCH`
- **Breaking (examples):** golden base `twinfile/base-ordered-route:0.1.0` renamed to **`twinfile/base-linear:0.1.0`** — update `from:` refs; the `linear` archetype value is unchanged

- **`tracks` `source: coverage`** — expected RF at a space from a radio asset (`graph-v0` engine, mergeable **`coverage_profiles`**, asset **`radio`**)
- Simulated sensor feeds (`simulate:` on sensors/gauges), situation **phaseStarts** on runner timelines, `twin feed simulate`
- [RFC 0003](rfcs/0003-time.md): scenario `clock`, `tracks` and `schedules` graph layers, JSON Lines feed rows, `place.location`, `sensors[].properties`
- **Path query** over the merged place (`queryPath`, MCP `place.path`): open openings and routes; `step_free` refuses stairs
- **MCP**: `twin serve --stdio` is newline-delimited JSON-RPC. Tools answer place questions; `place_init` scaffolds a place with the same path as `twin init place --geotype`. `twin://place`, `twin://layers`, `twin://place/{collection}/{id}`, and `twin://runs/{run}` are resources
- **RFC 0006** bridge plugins: [`doc/pack/bridges.md`](doc/pack/bridges.md), optional manifest `bridges:`, glTF/IFC appendix hooks
- **Appendix mappings** for IMDF, GTFS, Brick, BOT, and SOSA: import writes `place/*.yaml` (or one feed row); fields with no column go in `ext`
- **Crosswalk** ([`conf/crosswalk.yaml`](conf/crosswalk.yaml)): a known external term lands only on the named field. GTFS pathways map onto `routes.kind` (`escalator`, `moving_sidewalk`); a station's coordinates are `location`; SOSA `madeBySensor` is `device_id` and `hasFeatureOfInterest` is `observes`. IMDF `museum` sets `geotype.primary` via `mappings.imdf`
- **Feed pull:** `feed.protocol` `sensorthings` and `ngsi-ld` write the JSON Lines file the clock already samples (`replay`), including `available_at`
- **Compose runner:** `use.runners` shares one bundle and one timeline; stdout merges by `t` with a `runner` id
- `type: command` run records are written after the runner exits; sending them is a separate consented step and is not a feed input
- New conformance category `time`
- Runners receive a precomputed `timeline` and MUST fail rather than emit placeholder metrics
- Renamed `doc/migration/archived-venue-to-place.md` → `venue-to-place.md` (layout check segment limit)

## 1.0.0-draft.2

- `place/visits` schema and conf vectors
- `place.archetype`, `place.authoring_scale`, and related place docs
- Global `conf/role-vocabulary.yaml` and [situation roles](doc/kinds/situation-roles.md) strict checks

## 1.0.0-draft.1

- Initial `@local-hosting/twinfile` publish: schemas, doc, conformance vectors, governance CI.
