# Changelog

## Unreleased

- **Breaking:** `twinfile: 2` place units ([spec RFC 0009](../spec/rfcs/0009-dockerfile-model/index.md)): ordered **`steps:`** (`plan:`, `copy:`, inline place collections); **`processors:`** + **`outlets:`** for host wiring (RFC 0007). `twin fmt` normalizes legacy `patches:`, `patch:`, `inputs`/`outputs`/`connections`. Manifest `buildings:` / `floors:` removed; `twin fmt --upgrade=2` converts v1 places. Compose readers: `listTwinfileInstructions`, `parseManifestPatches`, `parseModuleGraphFromTwinfile`, `twinfileStepItems`
- **Breaking:** core no longer renders or serves HTML; dependencies run one way (`@twinfile/editor` → `@doppler-group/twinfile-core`). `twin view` is now `twin-workbench` in `@twinfile/editor`; card, DTPR disclosure HTML, `twinfile-output.css`, and the viewer assets moved to `@twinfile/editor/render`. `twin card` prints ASCII, `--json`, `--yaml`, or `--markdown`; `twin disclose` prints `--json` or `--yaml`; MCP `place.card` drops `html` / `htmlPreview`. Removed viewer exports (`buildViewerCatalog`, `listViewerUnits`, `buildLayoutOverview`, `viewerSampleAt`, …); added `resolveTwinfileAnchor`, `patchModuleUseMode`, `patchModuleWireIo`, `elementLabelsForInlineDtpr`, `fetchDtprLabelsForDisclosures`
- **`twin fmt [path] [--recursive] [--check]`** — format one manifest file, one unit dir, or every `twinfile: 1` YAML under a tree; lifts legacy **`plans:`** into **`layers:`**
- **`twin init place`** writes **`place/BUILDINGS.md`** when geotypes **`suggestBuildingImportForSlug`** is true (RFC 0005 checklist); CLI prints a `next:` line
- Golden examples split interiors: `arena-concourse`, `expo-pavilion-opportunity`, `port-warehouse`, `coliving-commons`; `placeBuildingImportRefStrings` for editor stack expansion
- Scenario **`clock`**, **`tracks`**, and **`schedules`** (spec RFC 0003): `createTimeline`, `openTimelineForPlace`, `createPlaceTimelinePayload`, `loadFeedRows`, `sunElevationDeg`
- **`queryPath`** / MCP **`place.path`**: shortest walk on open openings and routes, or spaces reachable from a role; `step_free` drops stairs
- **`twin serve --stdio`** speaks MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`) for one place directory, including `twin://place`, `twin://layers`, `twin://place/{collection}/{id}`, and `twin://runs/{run}`
- MCP **`place_init`** scaffolds a place with the same path as `twin init place --geotype`, either in the served directory or in another `dir`, without replacing the place the server is reading
- Pin **`@doppler-group/twinfile-bridge@0.1.1`** — unified built-in package ([`twinfile/bridge`](https://github.com/twinfile/bridge))
- **`importExternal` / `exportExternal`** moved to `@doppler-group/twinfile-bridge`; `twin import|export --bridge <npm:…>` ([RFC 0006](../spec/rfcs/0006-bridge-plugins.md))
- Importers follow [`spec/conf/crosswalk.yaml`](../spec/conf/crosswalk.yaml): GTFS `pathways.txt` becomes `routes`, station coordinates become `location`, Brick IRIs land on `brick`, and SOSA `madeBySensor` / `hasFeatureOfInterest` land on `device_id` / `observes`
- **`pullFeedRows`** (`twin feed pull`) writes SensorThings and NGSI-LD readings into the JSON Lines file a replay scenario already points at
- **`runner-compose`** runs `use.runners` on one stdin bundle and timeline, merges JSON Lines by `t`, and prefixes each record with the runner id
- **`type: command`** records are assembled after the runner exits; `twin command send --allow-send` transmits them without touching feed files
- Runners receive a precomputed **`timeline`**; MCP **`state.at`** returns the sample at `t` when the scenario has a clock
- **`runner-replay`** reads a timeline track (`args.track`, `args.threshold`), reports `time_until_known_unsafe_s`, and fails instead of emitting placeholder metrics
- CLI and MCP share **`createRunPayload`**
- Conformance runner handles the **`time`** category
- Place composition per RFC 0004 (`composePlace`): **`with:`** mixins compose after the `from:` chain and before local layers (`mixin` build layers), **`axes:`** derive `place.archetype`, and load-time axis rules use the resolved axes; mixin conflicts, `applies_to`, and archetype mismatches fail fast. Plan paths add every mixin's `plans:`
- **`twin init place --geotype`** sets demo **`ext`** on **`footprint`** as well as site/area slugs; writes `axes:` for axes the archetype leaves open and decorates with golden **`with:`** mixins (`--no-decorate` to skip), one per suggested situation plus `mixin-assets` / `mixin-sensors`, instead of copying stubs and plans; every place geotype passes `twin check --strict` after init; asset geotypes (`isAssetGeotype`, e.g. `stop_sign`) fail with a pointer to `assets.yaml`
- **`twin add plan`** always writes **`actions`** (empty when no role has a default state) and sets defaults for `shelter`, `ground-transport`, and `water-launch` alongside `outdoor`
- **`twin add assets`** accepts a `space` option for the starter kiosk; init's default unit name normalizes the directory name to a valid id
- Place archetype checks key off `@doppler-group/geotypes` axes (`PLACE_ARCHETYPE_AXES`); new archetype **`open_area`**; base ref **`base-ordered-route`** → **`base-linear`**
- **Breaking:** removed the **`network`** archetype and `twinfile/base-network:0.1.0`

## 0.1.2 — 2026-11-05

- **`@doppler-group/geotypes@0.1.2`** (dist tarball): geotype validation, Schema.org JSON-LD export, place mount metadata
- Publish CI consumes geotypes from GitHub Packages (`TF_PUBLISH_USE_REGISTRY`)

## 0.1.1 — 2026-11-05

- Registry tarball includes place-mount **`dist`** exports (`resolvePlaceMounts`, `TwinfilePlaceMount`, …)
- Pin **`@doppler-group/geotypes@0.1.1`** for published consumers; CI geotypes checkout + publish export gate
- Vitest **4.1.12**

## 0.1.0 — 2026-11-04

First public reference implementation aligned with `@doppler-group/twinfile-spec` **1.0.0-draft.1**.

- Load and validate Twinfile units (twinfile, `place/` layers, plans) with AJV and YAML positions
- Strict place checks against example situations and contract roles
- Content-addressed build: merge, bundle digest, `Twinfile.lock`, `--frozen`
- Five-layer scenario compose (place → event → plan → situation → patches → args)
- OCI pack and registry **push** / **pull** (`ghcr.io/doppler-group/twinfile/…`) per RFC 0002
- **`twin`** CLI: `check`, `build`, `pack`, `push`, `pull`, `ref resolve|validate`
- Place catalog URIs and **`resolvePlaceMounts`** / **`resolvePlaceMount`** for host venue wiring
- Conformance runner for spec `conf/` vectors; CI checks against `twinfile/examples`

Not in 0.1.0: hydraulic/replay runners, MCP, viewer, plane repo slimming. Venue layout: **`resolvePlaceMount`** in core; archived venue repo repo — [migration](../../spec/doc/migration/archived-venue-to-place.md).
