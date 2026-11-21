# Twinfile monorepo

**Layout:** [`catalog/README.md`](catalog/README.md), [`README.md`](README.md), glossary [repository layout](packages/twinfile/spec/doc/glossary.md#repository-layout-prose).

| Layer | Path |
| --- | --- |
| Published npm package | `packages/twinfile/` (`@local-hosting/twinfile` + subpaths) |
| Golden twins + type libs | `packages/twinfile/src/catalog/<type>/` |
| Ops conf (in-repo) | `catalog/conf/` |
| Normative spec | `packages/twinfile/spec/` |
| Workbench viewer | `packages/twinfile/src/workbench/viewer/` |
| Site | `packages/site/` |
| Repo checks | `packages/tooling/` |

**Verify:** `yarn check:twinfile` from repo root. **Env:** none inside the repo; `TF_TWINFILE_ROOT` only when running from outside it. Paths derive from [`catalog-layout.ts`](packages/twinfile/src/core/paths/catalog-layout.ts).

Controlled vocabulary: [`packages/twinfile/spec/doc/glossary.md`](packages/twinfile/spec/doc/glossary.md). Do not reintroduce root `catalog/<type>/` workspaces or per-type npm package names (`@local-hosting/twinfile-event`, …).