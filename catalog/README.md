# Twin catalog (in-repo)

Twin type source lives under **`packages/twinfile/src/catalog/<type>/`** (examples, libs, contract). Consumers install one package: **`@local-hosting/twinfile`** with subpaths such as **`/place`**, **`/event`**, **`/simulator`**.

The repo root **`catalog/`** folder holds **ops conf only** (`catalog/conf/`). Per-type hubs (`catalog/place/`, …) and hyphenated npm names (`@local-hosting/twinfile-event`, …) are retired.

| Kind | Examples (in repo) |
| --- | --- |
| place | `packages/twinfile/src/catalog/place/examples/<id>/` |
| resource | `packages/twinfile/src/catalog/resource/examples/<id>/` |
| character | `packages/twinfile/src/catalog/character/examples/<id>/` |
| context | `packages/twinfile/src/catalog/context/examples/<id>/` |
| story | `packages/twinfile/src/catalog/story/examples/<id>/` |
| event | `packages/twinfile/src/catalog/event/examples/<id>/` |

**Simulator** lives at `packages/twinfile/src/simulator/` (not a catalog twin type).

Normative spec: `packages/twinfile/spec/`. See [unit-layout.md](../packages/twinfile/spec/doc/unit-layout.md).