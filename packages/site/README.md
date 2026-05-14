# twinfile.org

Documentation for [Twinfile](https://twinfile.org): guides, reference, and the canonical JSON Schema tree (`/schemas/1/…`, the `$id` URLs in `@local-hosting/twinfile`).

The Accord Labs site lives in [`accord-labs/accord.fm`](../../accord-labs/accord.fm). Brand code (fonts, tokens, logo) is copied into this app under `src/brand` and `src/styles`. It is not shared with that site.

## Local development

In the **local-hosting/twinfile** monorepo, run `yarn dev` from **`packages/site`**. Set **`TF_TWINFILE_ROOT`**, **`TF_PLACE_CATALOG`** (or **`TF_EXAMPLES_ROOT`**), and optional **`TF_SPEC_ROOT`** → `packages/spec`. The YAML studio is under `src/twinfile-studio/`.

```bash
cp .env.example .env.local
yarn install   # from the workspace root
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). `yarn build` syncs schemas from the spec checkout into `public/schemas/` before the Next.js build.

| Variable | Points to |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | This site (`http://localhost:3000`) |
| `NEXT_PUBLIC_MARKETING_SITE_URL` | Accord site (`http://localhost:3001`) |

## Deploy

See [`DEPLOY.md`](DEPLOY.md). Public URL: `https://twinfile.org`. Schema files stay on this host so existing `$id` URLs keep resolving.
