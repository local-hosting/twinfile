# @local-hosting/twinfile-character

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

```text
src/
  twin-module.ts
  mounts/                 # legacy AXM pcm-ids sidecar reader
    persona/                # PCM — journey/, empathy/, people/, contract/, schemas/
    situations/             # JSM — job situations + JTBD catalogs
# twin example heads → catalog/character/examples/
# PCM/JSM YAML libs   → catalog/character/libs/{audience,journey,psychology}/
```

Import **`@local-hosting/twinfile-character/pcm`** and **`…/jsm`**. **`disclosure:`** required on published characters.