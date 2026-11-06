# Place examples

Golden **place** catalog: sites and bases. Layout: `packages/twinfile/src/catalog/place/examples/<id>/<id>.twin.yaml`.

Other twin types:

| Type | Examples root |
| --- | --- |
| **place** | `packages/twinfile/src/catalog/place/examples/` (this catalog) |
| **resource** | [`catalog/resource/examples/`](../../resource/examples/) |
| **character** | [`catalog/character/examples/`](../../character/examples/) |
| **story** | [`packages/twinfile/src/catalog/story/examples/`](../../story/examples/) — scenes with inline `run:` |

**Runs:** only as inline **`run:`** on **`story.scenes[]`** (`packages/twinfile/src/catalog/story/examples/<story>#<scene-id>`).

No environment setup is needed inside the monorepo; tools find this catalog from the repo root.

Normative layout: [`packages/twinfile/spec/doc/unit-layout.md`](../../../../spec/doc/unit-layout.md). Vocabulary: [`packages/twinfile/spec/doc/glossary.md`](../../../../spec/doc/glossary.md#quick-reference-prose--yaml).

### Vocabulary (one word per layer)

See the glossary quick-reference table — **base**, **programme**, **site**, **geotype**, **resource**, **run**, **player**, **runner**, **step** (authoring), **build layer** (output).

Golden digests: [`published-refs.json`](published-refs.json).