# @local-hosting/twinfile

One published npm package for Twinfile core, catalog types, bridge, CLI, and simulator.

## Layout

| Path | Role |
| --- | --- |
| `src/core`, `src/bridge`, `src/cli`, `src/simulator` | Runtime modules |
| `src/catalog/*` | Character, context, story, place, event, resource |
| `spec/` | Normative schemas and docs (not a separate npm package) |
| `dist/` | Publish output (barrel + `./bridge`, `./loro`, `./simulator`) |

Single npm name only — import `@local-hosting/twinfile` and documented subpaths (`/bridge`, `/loro`, `/place`, `/character`, `/simulator`, …). Retired `@local-hosting/twinfile`, `-place`, etc. are not published or used in source.

Build: `yarn build` from this folder. Tests and vitest resolve the `development` condition on `package.json#exports` (source under `src/`).