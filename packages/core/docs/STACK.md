# Twinfile stack boundaries

## Self-standing open stack (this repo)

```text
@local-hosting/twinfile     JSON Schema + conf vectors
       ↓
@local-hosting/twinfile-core     load · validate · build · lock · OCI · twin CLI
       ↓
examples catalog (sites, runs, bases, mixins) + @local-hosting/twinfile-simulator situations
```

**Authoritative model:** Twinfile units → **`Place`** (`Place.data`); runs via `preset.yaml`; place events in TS catalog. **Not** archived venue YAML trees, **not** AXM six-plane docs.

**Host production path:** `twin pull` → build → run/disclose (OCI digest pins). Local dev: `resolveExamplePlace` + `catalog/place/examples/twin.local.yaml`.

## What we deliberately omit from core

- Closed-host persistence imports (see `core/scripts/check-open-standard.mjs`)
- Six-plane product compose (place mounts, grade strategy planes)
- Automated venue YAML→place migrator (repo [archived](https://github.com/twinfile/vlm); hand port via [archived-venue-to-place](../../spec/doc/migration/venue-to-place.md))
