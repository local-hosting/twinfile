# Twinfile delivery roadmap

Maintainer index (not published on twinfile.org). Public stack: [`STACK.md`](STACK.md).

**Monorepo gate:** `yarn check:twinfile` → [`packages/tooling/scripts/check-workspace.mjs`](../tooling/scripts/check-workspace.mjs). CI: [`.github/README.md`](../../.github/README.md).

## Workspace layout (local-hosting/twinfile)

| Path | Package | Gate |
| --- | --- | --- |
| [`packages/twinfile/spec/`](../twinfile/spec/) | `@local-hosting/twinfile` | `yarn workspace … check` |
| [`packages/twinfile/`](../twinfile/) | `@local-hosting/twinfile` | `check`, `conformance`, `check:examples` |
| [`packages/twinfile/src/catalog/place/examples/`](../../packages/twinfile/src/catalog/place/examples/) | place golden catalog | `check:examples` / `check:catalog-golden` |
| [`packages/twinfile/src/catalog/<type>/`](../../packages/twinfile/src/catalog/) | `@local-hosting/twinfile/<type>` subpath | tests under `packages/twinfile` |
| [`packages/twinfile/src/simulator/`](../twinfile/src/simulator/) | `@local-hosting/twinfile/simulator` | `yarn check` |
| [`packages/site/`](.) | `@local-hosting/twinfile-docs` | `yarn lint`, `yarn build` |
| [`../geotypes/`](../../../geotypes/) (sibling) | `@local-hosting/geotypes` | `yarn check` in geotypes repo |

## Milestones

| ID | Status | Done when |
| --- | --- | --- |
| M1 Workspace | done | `yarn run check:twinfile` |
| M2 Spec vectors | done | `packages/twinfile/spec/conf/` + `check-index.mjs` |
| M3 Core runtime | done | twin.local, cache, query, conformance |
| M4 Runners | done (in-core) | `twin run` / `twin verify` / lock / layers |
| M5 MCP + viewer | partial | MCP in CLI; viewer static |
| M6 Examples | partial | Golden catalog + story runs |
| M7 Examples CI | done | `packages/twinfile/src/catalog/place/examples/published-refs.json`, matrix |
| M8 Productgrade | partial | Frameworks + scenario metrics in core/method |

## Plan phase mapping

- **Spec** → `packages/twinfile/spec/` + `packages/twinfile/spec/conf/`
- **Package** → `packages/twinfile/` (core, catalog, CLI, bridge, simulator)
- **Catalog** → `packages/twinfile/src/catalog/<type>/examples/` (place default for compose)

## Out of scope

Sibling repos: **geotypes**, **geokit**, **frameworks** — not yarn workspaces here.