# @local-hosting/twinfile-story

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

```text
src/
  twin-module.ts          # story head module + normalization
  contract/
    narrative/            # SAM (npm subpath …/sam)
examples/*/<story>.twin.yaml  # story.scenes[].run — scene runs (not twins)
```

Import **`@local-hosting/twinfile-story/sam`** when compiling episodes; **`<unit>.twin.yaml`** twins depend on **`@local-hosting/twinfile-core`** only.