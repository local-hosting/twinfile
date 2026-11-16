# Moved from github.com/twinfile

Active development continues in **local-hosting/twinfile** (this monorepo).

| Former repo | Path here |
| --- | --- |
| twinfile/spec | `packages/spec/` |
| twinfile/core | `packages/core/` |
| twinfile/bridge | `packages/bridge/` |
| twinfile/simulator | `packages/simulator/` |
| twinfile/examples | `catalog/place/examples/` |
| twinfile/persona | `catalog/character/`, `catalog/story/`; frameworks → `@local-hosting/frameworks` (`../frameworks`) |
| twinfile/twinfile.org | `packages/site/` |

Set **`TF_TWINFILE_ROOT`** to the monorepo root. Prefer **`TF_EXAMPLES_ROOT`** → `catalog/place/examples`.

npm: **`@local-hosting/twinfile-*`**. OCI: **`ghcr.io/local-hosting/twinfile/...`**.