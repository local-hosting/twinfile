# Twinfile delivery roadmap

Maintainer index (not published on twinfile.org). Public stack: [`STACK.md`](STACK.md).

**Monorepo gate:** `yarn check:twinfile` → [`packages/tooling/scripts/check-workspace.mjs`](../tooling/scripts/check-workspace.mjs). CI: [`.github/README.md`](../../.github/README.md).

## Workspace layout (doppler-group/twinfile)

| Path | Package | Gate |
| --- | --- | --- |
| [`packages/spec/`](../spec/) | `@doppler-group/twinfile-spec` | `yarn workspace … check` |
| [`packages/core/`](../core/) | `@doppler-group/twinfile-core` | `check`, `conformance`, `check:examples` |
| [`catalog/place/examples/`](../../catalog/place/examples/) | place golden catalog | `check:examples` / `check:catalog-golden` |
| [`catalog/<type>/`](../../catalog/) | `@doppler-group/twinfile-<type>` | `yarn check` per type workspace |
| [`packages/simulator/`](../simulator/) | `@doppler-group/twinfile-simulator` | `yarn check` |
| [`packages/site/`](.) | `@doppler-group/twinfile-docs` | `yarn lint`, `yarn build` |
| [`../geotypes/`](../../../geotypes/) (sibling) | `@doppler-group/geotypes` | `yarn check` in geotypes repo |

## Milestones

| ID | Status | Done when |
| --- | --- | --- |
| M1 Workspace | done | `yarn run check:twinfile` |
| M2 Spec vectors | done | `packages/spec/conf/` + `check-index.mjs` |
| M3 Core runtime | done | twin.local, cache, query, conformance |
| M4 Runners | done (in-core) | `twin run` / `twin verify` / lock / layers |
| M5 MCP + viewer | partial | MCP in CLI; viewer static |
| M6 Examples | partial | Golden catalog + story runs |
| M7 Examples CI | done | `catalog/place/examples/published-refs.json`, matrix |
| M8 Productgrade | partial | Frameworks + scenario metrics in core/method |

## Plan phase mapping

- **Spec** → `packages/spec/` + `packages/spec/conf/`
- **Core** → `packages/core/` (+ `packages/cli/`, `packages/bridge/`)
- **Catalog** → `catalog/<type>/examples/` (place default for compose)

## Out of scope

Sibling repos: **geotypes**, **geokit**, **frameworks** — not yarn workspaces here.