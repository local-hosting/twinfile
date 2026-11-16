# Fieldwise consumer codemod (phase 0)

In each fieldwise repo:

1. `yarn rename:scope` from twinfile monorepo root, or apply `@twinfile/*` → `@doppler-group/twinfile-*` and `@doppler-group/geotypes` / `@doppler-group/geokit`.
2. Set `TF_TWINFILE_ROOT` to the twinfile monorepo; `TF_EXAMPLES_ROOT=place/examples`.
3. Remove `npmScopes.twinfile` from `.yarnrc.yml`; use `doppler-group` + `TF_PACKAGES_TOKEN` org secret.
4. fieldwise-canvas: `portal:../geokit` (sibling under `doppler-group/`).

OCI pulls: `ghcr.io/doppler-group/twinfile/<type>/<id>:<tag>`.