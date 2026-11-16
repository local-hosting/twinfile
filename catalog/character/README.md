# @local-hosting/twinfile-character

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

```text
src/
  twin-module.ts
  mounts/                 # legacy AXM character-id sidecar reader
  contract/
    persona/                # journey/, empathy/, people/, contract/, schemas/
    situations/             # job situations + JTBD catalogs
# twin example heads → catalog/character/examples/
# character YAML libs → catalog/character/libs/{audience,journey,psychology}/
```

Import **`@local-hosting/twinfile-character/persona`** (persona) and **`…/situations`** (situations) — legacy subpath names. **`disclosure:`** required on published characters.
