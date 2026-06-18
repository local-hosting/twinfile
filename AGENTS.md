# Twinfile monorepo

**Layout:** [`catalog/README.md`](catalog/README.md), [`README.md`](README.md), glossary [repository layout](packages/spec/doc/glossary.md#repository-layout-prose).

| Layer | Path |
| --- | --- |
| Catalog (twins + ops conf) | `catalog/<type>/`, `catalog/conf/` |
| Format / conformance | `packages/spec/` (`spec/conf/` = vectors only) |
| Kernel | `packages/core/`, `packages/cli/`, `packages/bridge/` |
| Player | `packages/simulator/` |
| Site | `packages/site/` |

**Verify:** `yarn check:twinfile` from repo root. **Env:** `TF_TWINFILE_ROOT`, `TF_PLACE_CATALOG`, `TF_SIMULATOR_ROOT`.

Controlled vocabulary: [`packages/spec/doc/glossary.md`](packages/spec/doc/glossary.md). Do not reintroduce root `examples/` or `conf/` symlinks.