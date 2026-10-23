# @local-hosting/twinfile

Twinfile **1.0.0-draft.1** — normative prose, JSON Schema (2020-12), and conformance vectors. No runtime implementation; implementations (for example `@local-hosting/twinfile`) MUST pin this package version.

## Layout

- [`doc/`](doc/index.md) — standard text (CC BY 4.0, see [`doc/gov/cc-by.md`](doc/gov/cc-by.md))
- [`schemas/1/`](schemas/1/defs.json) — machine-readable schemas (MPL-2.0)
- [`conf/`](conf/index.json) — conformance vectors

## Check

```bash
yarn install
yarn check
```

## Publish

npm package `@local-hosting/twinfile` exposes `doc/`, `schemas/`, `conf/`, and `rfcs/` via the `files` field.
