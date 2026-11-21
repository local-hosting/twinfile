# Example workbench (`twin-view`)

Local dev host for golden [`catalog/place/examples/`](../../../catalog/place/examples/) and simulator place events.

```bash
yarn workbench    # monorepo root → http://localhost:4173
```

## HTTP surface (minimal)

| Route | Role |
| --- | --- |
| `GET /api/catalog` | Browse catalog `entries` (+ `defaultEntryId`). `?scope=place`: site Twinfiles only. |
| `GET /api/preview?entry=` | Build place; `view=index` \| `variation`; optional `lens=` for a run. |
| `GET /api/source?entry=` | Raw `<unit>.twin.yaml` (scene runs return their story head) (studio). |
| `GET /api/time/clock`, `GET /api/time/at`, `POST /api/time/advance` | Session clock scrub when a run has `clock:` (uses `@local-hosting/twinfile-simulator/host`). |

**Context pulses** (`applyPlayerContextPulse`, event/signal drives) are **`@local-hosting/twinfile-simulator/host`** — not HTTP on this server.

Static: `index.html`, `viewer-app.js`. Catalog listing without HTTP: `listViewerCatalog` from `@local-hosting/twinfile-simulator/viewer`.

Env: **`TF_TWINFILE_ROOT`** only when running outside the repo.
