# portable host consumer codemod (phase 0)

In each catalog-host repo:

1. `yarn rename:scope` from twinfile monorepo root, or apply `@twinfile/*` → `@local-hosting/twinfile-*` and `@local-hosting/geotypes` / `@local-hosting/geokit`.
2. Set `TF_TWINFILE_ROOT` to the twinfile monorepo; `TF_EXAMPLES_ROOT=place/examples`.
3. Remove `npmScopes.twinfile` from `.yarnrc.yml`; use `local-hosting` + `TF_PACKAGES_TOKEN` org secret.
4. map-host: `portal:../geokit` (sibling under `local-hosting/`).

OCI pulls: `ghcr.io/local-hosting/twinfile/<type>/<id>:<tag>`.