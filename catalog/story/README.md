# @doppler-group/twinfile-story

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

```text
src/
  twin-module.ts          # story head module + normalization
  contract/
    narrative/            # story narrative (npm subpath …/narrative)
examples/*/<story>.twin.yaml  # story.scenes[].run — scene runs (not twins)
```

Import **`@doppler-group/twinfile-story/narrative`** when compiling Story runs from mounted twins; **`<unit>.twin.yaml`** heads depend on **`@doppler-group/twinfile-core`** only.
