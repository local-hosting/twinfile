# CI

**Canonical workflows:** this directory only (monorepo `local-hosting/twinfile`).

| Workflow | Role |
| --- | --- |
| [`ci.yml`](workflows/ci.yml) | `yarn check:twinfile` on push/PR |
| [`publish-local-hosting.yml`](workflows/publish-local-hosting.yml) | npm publish for `@local-hosting/*` packages |

Per-package `.github/` under `packages/*` was removed — those workflows targeted the old split `twinfile/*` repos.

**CI install:** `yarn` resolves `portal:` / `link:` to sibling repos (`../geotypes`, `../frameworks`, `../geokit`, and geotypes’ `../../westlane/isocanvas`). The workflow shallow-clones those private repos before install (requires repo secret **`TF_PACKAGES_TOKEN`**: a PAT with **read** on those repos, including **`westlane/isocanvas`**). Optional: `packages/tooling/scripts/ci-prepare-monorepo-install.mjs` for a future registry-only path.

**Env (CI and local):**

| Variable | Path |
| --- | --- |
| `TF_TWINFILE_ROOT` | Repository root |
| `TF_PLACE_CATALOG` | `catalog/place/examples` |
| `TF_EXAMPLES_ROOT` | Same as `TF_PLACE_CATALOG` (legacy name) |
| `TF_SIMULATOR_ROOT` | `packages/simulator` |

See [`catalog-layout.ts`](../packages/core/src/paths/catalog-layout.ts) and [glossary — repository layout](../packages/spec/doc/glossary.md#repository-layout-prose).