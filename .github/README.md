# CI

**Canonical workflows:** this directory only (monorepo `doppler-group/twinfile`).

| Workflow | Role |
| --- | --- |
| [`ci.yml`](workflows/ci.yml) | `yarn check:twinfile` on push/PR |
| [`publish-doppler-group.yml`](workflows/publish-doppler-group.yml) | npm publish for `@doppler-group/*` packages |

Per-package `.github/` under `packages/*` was removed — those workflows targeted the old split `twinfile/*` repos.

**Sibling checkouts (CI):** `yarn` links `portal:` / `link:` deps to `../geotypes`, `../frameworks`, and `../geokit`. The workflow checks out those private repos beside the workspace before `yarn install`. Set org/repo secret **`TF_PACKAGES_TOKEN`** (PAT with `repo` + `read:packages`) if `GITHUB_TOKEN` cannot read sibling repos.

**Env (CI and local):**

| Variable | Path |
| --- | --- |
| `TF_TWINFILE_ROOT` | Repository root |
| `TF_PLACE_CATALOG` | `catalog/place/examples` |
| `TF_EXAMPLES_ROOT` | Same as `TF_PLACE_CATALOG` (legacy name) |
| `TF_SIMULATOR_ROOT` | `packages/simulator` |

See [`catalog/manifest.yaml`](../catalog/manifest.yaml) and [glossary — repository layout](../packages/spec/doc/glossary.md#repository-layout-prose).