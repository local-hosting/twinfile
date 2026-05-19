# @local-hosting/twinfile-story

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../packages/spec/doc/type-package-layout.md).

```text
src/
  twin-module.ts          # Story.yaml module + head normalization
  contract/
    narrative/            # SAM (npm subpath …/sam)
examples/*/scenes/*/run.yaml   # scene runs (not twins)
```

Import **`@local-hosting/twinfile-story/sam`** when compiling episodes; **`Story.yaml`** twins depend on **`@local-hosting/twinfile-core`** only.