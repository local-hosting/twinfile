# Twinfile stack boundaries

Maintainer note. The public docs site no longer publishes this page. Adopters start at [Author a place](src/app/author/page.mdx).

## Self-standing open stack (this repo)

```text
@local-hosting/twinfile     JSON Schema + conf vectors
       ↓
@local-hosting/twinfile-core     load · validate · build · lock · OCI · twin CLI
       ↓
examples (golden catalog) + @local-hosting/twinfile-simulator (situations / viewer)
```

**Authoritative model:** Twinfile units (`twinfile/name:semver`, `place/` layers, `Place.data`, plans, scenarios). **Not** archived venue YAML trees, **not** AXM six-plane docs.

**Host production path:** `twin pull` → build → run/disclose (OCI digest pins). Local dev: `resolveExamplePlace` + `catalog/place/examples/twin.local.yaml`.

## Public web (separate from open-stack repos)

| URL | GitHub | Role |
| --- | --- | --- |
| [twinfile.org](https://twinfile.org) | [`packages/site/`](.) in `local-hosting/twinfile` | Guides and JSON Schema URLs |
| [accord.fm](https://accord.fm) | `accord-labs/accord.fm` | Accord Labs — local-first AI |

CLI static output (disclose HTML, viewer) shares CSS via [`src/styles/twinfile-output.css`](src/styles/twinfile-output.css) when `@local-hosting/twinfile-core` is checked out beside this tree.

## What we deliberately omit from core

- Closed-host persistence imports (see `core/scripts/check-open-standard.mjs`)
- Six-plane product compose (place mounts, grade strategy planes)
- Automated venue YAML→place migrator (repo [archived](https://github.com/twinfile/vlm); hand port via [archived-venue-to-place](../spec/doc/migration/venue-to-place.md))
