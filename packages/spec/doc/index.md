# Twinfile 1.0 (draft)

Spec document version **1.0.0-draft.1**. Manifest field **`twinfile: 1`**.

## Conventions

Normative keywords follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

## Docker mapping

Short form; see [Composition](build/composition.md) for place patches vs compose layers.

| Docker | Twinfile |
| --- | --- |
| Dockerfile | **`<unit>.twin.yaml`** recipe for a **place** + `place/` (v2: `steps:`; v1: `layers:`) |
| `FROM` | **`from:`** on a place (scene **`run.yaml`**: **`from:`** place ref) |
| Patch steps | Place **`steps:`** / v1 **`layers:`** (YAML merge; base **`from:`** first) |
| Runtime stack | Run compose: event → plan → patch → **`args:`** (scene `run.yaml`, not a Twinfile) |
| `ARG` | **`args:`** |
| `ENTRYPOINT` | **`use.runner`** (offline); live play uses host **player** → module bus ([World session](place/world-session.md)) |
| `docker history` | **`twin layers`** |
| Image digest | **`Place.digest`** + **`<unit>.twin.lock`** |
| Registry | OCI artifacts (`oci:…`) |

## TOC

- [Place Twinfile (compose artifacts)](kinds/kinds.md)
- [Natural hazards → events](kinds/natural-hazards.md)
- [Humanitarian marker crosswalk](kinds/hr-marker-crosswalk.md)
- [Place layers](place/place.md)
- [World session (player vs runner)](place/world-session.md)
- [Time (clock, tracks, feeds)](place/time.md)
- [Campus → building → floor](place/campus-building-floor.md)
- [Build layers](build/layers.md)
- [Built Place](build/built-place.md)
- [Composition](build/composition.md)
- [Integration (open vs host)](pack/integration.md)
- [Module patch graph](pack/patch.md)
- [Open integration roadmap](pack/integration-roadmap.md)
- [Packaging](pack/refs.md)
- [Governance](gov/security.md)
- [Appendix](map/appendix.md)
- [Migration: archived Archived venue → place units](migration/venue-to-place.md)
- [Migration: `access_points` → `markers`](migration/ap-to-markers.md)
