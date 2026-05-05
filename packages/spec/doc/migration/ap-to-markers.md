# Migration: `access_points` → `markers`

Twinfile 1.0 draft renames the place collection to avoid confusion with Wi‑Fi access points on **`assets`**.

| Before | After |
| --- | --- |
| `place/access_points.yaml` | `place/markers.yaml` |
| YAML key `access_points:` | `markers:` |
| Situation `expects.*.kind: access-point` | `kind: marker` |
| Schedule `uses.access_point` | `uses.marker` |
| Schema `access-points.schema.json` | `markers.schema.json` |

Role ids (`safe-access`, `collection-point`, …) are unchanged. Yards and staging areas stay on **`spaces`**, not `markers`.
