# Deploy twinfile.org

This repository is the docs app. Vercel project root is the repository root (not a `docs/` subdirectory).

## Vercel

1. Vercel **Root Directory:** `packages/site` (monorepo `doppler-group/twinfile`), or import legacy **`twinfile/twinfile.org`**
2. **Root Directory:** repository root
3. **Environment:** `NEXT_PUBLIC_SITE_URL=https://twinfile.org`, `NEXT_PUBLIC_MARKETING_SITE_URL=https://accord.fm`
4. **Domain:** `twinfile.org`

The build runs `scripts/sync-schemas.mjs`. In the **doppler-group/twinfile** monorepo no env is needed; outside it, set `TF_TWINFILE_ROOT`. Legacy split-repo CI checked out `twinfile/spec` and `twinfile/examples` separately.

## CI

The docs site embeds a local YAML studio under `src/twinfile-studio/`. Example Twinfiles resolve from `catalog/place/examples` under the repo root (or `TF_TWINFILE_ROOT`).

Repo secret **`TF_PACKAGES_TOKEN`**: a token with `read:packages` when CI still pulls split `twinfile/*` checkouts.

JSON Schema responses under `/schemas/:path*` send a public cache header and `Access-Control-Allow-Origin: *`.

## Local

```bash
cp .env.example .env.local
yarn install   # from the workspace root
yarn dev
```
