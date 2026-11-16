# Conformance vectors (four twin types)

| Type | Vectors |
| --- | --- |
| **place** | `conf/schema/ok|bad/twinfile/` place heads, `packages/core/test/` build + compose |
| **resource** | `catalog/resource/examples/greeter-kiosk`, `res-wire.schema.json` |
| **character** | `catalog/character/examples/shop-greeter` (`disclosure:` required), `char-wire.schema.json` |
| **story** | `catalog/story/examples/shop-visit`, scene `run.yaml`, `story-wire.schema.json` |

**Runs** (`role: run`) conform via core load/verify on `story/.../scenes/*/run.yaml`; they are not published as `twinfile/event/` twins.

Cross-cutting: `twinfile fmt`, OCI pack, `project export`, no `question` on twin heads.