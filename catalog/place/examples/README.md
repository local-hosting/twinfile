# Place examples

Golden **place** catalog: sites, bases, mixins. Layout: `catalog/place/examples/<id>/` with **`Place.yaml`** or legacy **`Twinfile.yaml`**.

Other twin types:

| Type | Examples root |
| --- | --- |
| **place** | `catalog/place/examples/` (this catalog) |
| **resource** | [`catalog/resource/examples/`](../../resource/examples/) |
| **character** | [`catalog/character/examples/`](../../character/examples/) |
| **story** | [`catalog/story/examples/`](../../story/examples/) — scenes + `scenes/<id>/run.yaml` |

**Runs:** only under **`catalog/story/examples/<story>/scenes/<scene>/run.yaml`**. Legacy site presets → `yarn sync:story-scenes`.

```bash
# Monorepo roots (local dev)
export TF_TWINFILE_ROOT=.
export TF_EXAMPLES_ROOT=$TF_TWINFILE_ROOT/catalog/place/examples
export TF_SIMULATOR_ROOT=$TF_TWINFILE_ROOT/packages/simulator
```

Normative layout: [`packages/spec/doc/unit-layout.md`](../../../packages/spec/doc/unit-layout.md). Vocabulary: [`packages/spec/doc/glossary.md`](../../../packages/spec/doc/glossary.md#quick-reference-prose--yaml).

### Vocabulary (one word per layer)

See the glossary quick-reference table — **base**, **programme**, **site**, **geotype**, **resource**, **run**, **player**, **runner**, **step** (authoring), **build layer** (output).

Golden digests: [`published-refs.json`](published-refs.json).