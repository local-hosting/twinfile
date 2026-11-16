# @local-hosting/twinfile-core

Reference implementation of [@local-hosting/twinfile](https://github.com/twinfile/spec) **1.0.0-draft.1**. Vendor-neutral: pinned JSON Schema validation, merge, contract checks, digests, OCI units, and the `twin` CLI.

## Install (GitHub Packages)

Org-private packages (`twinfile` on GitHub). Authenticate then install:

```bash
# ~/.npmrc
@twinfile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

npm install @local-hosting/twinfile-core@0.1.0
# twin binary on PATH after install
npx twin check ./my-place
```

Requires **`@local-hosting/twinfile@1.0.0-draft.1`** on the same registry (install as a dependency automatically when using npm/yarn with the scope registry above).

## Develop


```bash
# sibling spec checkout at ../spec
yarn install
yarn check
yarn conformance   # all spec conf/schema vectors
yarn build
# `twin` CLI lives in `@local-hosting/twinfile-simulator` (depends on this package).
node ../simulator/dist/cli/twin.js check path/to/unit
node ../simulator/dist/cli/twin.js build path/to/unit   # in-memory image + Twinfile.lock
node ../simulator/dist/cli/twin.js pack path/to/unit
node ../simulator/dist/cli/twin.js push path/to/unit --ref twinfile/arena:1.2.0   # needs GITHUB_TOKEN / OCI_REGISTRY_TOKEN
node ../simulator/dist/cli/twin.js pull twinfile/arena:1.2.0 --out ./arena
# or after install / link: twin check | build | pack | push | pull …
```

CLI (`twin`): `check` (`--strict`, `--frozen`), `build`, `pack`, `push`, `pull`, `ref resolve|validate`, `summary` (`card`), `layout summary`, `query`, `describe`, `disclose`, `run`, `serve --stdio` (MCP).

```bash
twin summary path/to/place
twin describe path/to/place --t 3600
twin serve path/to/place --stdio    # MCP: place_card, state_at, narrate, twin://place, …
```

MCP tools and resources: [`spec/doc/pack/mcp.md`](../spec/doc/pack/mcp.md).

Build yields a **`Place`** (`Twinfile.build()` / `buildTwinfile`). **`Twinfile.lock`** pins manifest/tree/layer chains at unit root. Wire JSON: `Place.toWire()` (`twin://place`). OCI layout via **`twin pack --out <dir>`**.

## API

- **Load / validate** — `loadTwinfile`, `validateTwinfileYamlPath`, `validateWorldYamlPath`, `createTwinValidator`
- **Examples / local refs** — `resolveExamplePlace`, `listExamplePlaceRefs`, `loadTwinLocalMap`, `loadTwinLocalMapMerged`, `defaultExamplesRoot`, `resolveSimulatorRoot` (on-disk sibling catalog under `TF_SIMULATOR_ROOT`; register hook is `@local-hosting/twinfile-simulator`)
- **Build** — `Twinfile`, `Place`, `buildTwinfile`, `composeScenarioLayers`, five-layer order (RFC 0001); `TwinfileBuilder`, `mergeObjects`, `sha256Digest`, `placeImageDigest`, `ContractChecker`, `RefResolver`, `resolveTwinfileByRef`

- **OCI** — `pushTwinfileToRegistry`, `pullTwinfileFromRegistry`, `packTwinfileOci`

Open-standard guards: `packages/tooling/scripts/check-vendor-neutral.mjs` (vendor-neutral) and `scripts/check-open-standard.mjs` (`src/` import hygiene).

## Release

Tag **`v0.1.0`** on `main` to run [publish.yml](../../.github/workflows/publish-local-hosting.yml) (npm `@local-hosting/twinfile-core@0.1.0`). The workflow needs repo secret **`TF_PACKAGES_TOKEN`** (PAT with `repo` + `write:packages`) to check out `twinfile/spec` and publish. **`@local-hosting/twinfile@1.0.0-draft.1`** must exist on GitHub Packages (tag `v1.0.0-draft.1` on spec — already published if the tag workflow returned 409).
