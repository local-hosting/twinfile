# CI

**Canonical workflows:** this directory only (monorepo `local-hosting/twinfile`).

| Workflow | Role |
| --- | --- |
| [`ci.yml`](workflows/ci.yml) | `yarn check:twinfile` on push/PR |
| [`publish-local-hosting.yml`](workflows/publish-local-hosting.yml) | npm publish for `@local-hosting/*` packages |

Per-package `.github/` under `packages/*` was removed — those workflows targeted the old split `twinfile/*` repos.

**CI install:** `yarn` resolves `portal:` / `link:` to sibling repos (`../geotypes`, `../frameworks`, `../geokit`, and geotypes’ `../../westlane/isocanvas`). The workflow shallow-clones those private repos before install (requires repo secret **`TF_PACKAGES_TOKEN`**: a PAT with **read** on those repos, including **`westlane/isocanvas`**).

**Env:** none in CI or inside the repo. Set `TF_TWINFILE_ROOT` to the repository root only when running tools from outside it; all catalog paths derive from that root. See [`catalog-layout.ts`](../packages/core/src/paths/catalog-layout.ts) and [glossary — repository layout](../packages/spec/doc/glossary.md#repository-layout-prose).