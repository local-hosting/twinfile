# @doppler-group/twinfile-tooling

Monorepo scripts — invoked from root `package.json`:

| Script | Role |
| --- | --- |
| `check-workspace.mjs` | Full open-stack gate (`yarn check:twinfile`) |
| `repo-hygiene.mjs` | `yarn hygiene` — legacy dirs, nested `node_modules` |
| `ci-prepare-monorepo-install.mjs` | CI: swap portal/link deps for GitHub Packages pins |
| `vn-scan-lib.mjs` / `check-vendor-neutral.mjs` | Vendor-neutral scan (packages call `node ../tooling/scripts/check-vendor-neutral.mjs`) |
| `sync-vendor-neutral-lib.mjs` | Copy vn-scan into sibling `geotypes` / `geokit` mirrors only |
| `sync-ci-tooling.mjs` | Refresh standalone mirror copies of `ci-prepare-deps` (monorepo uses tooling paths) |
| `sync-story-scenes.mjs` | Place `scenarios/` → story `run.yaml` |
| `resolve-twin-cli.mjs` | Resolve built `twin` binary for catalog scripts |

CI map: [`.github/README.md`](../../.github/README.md).