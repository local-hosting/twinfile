# Humanitarian marker crosswalk

Map-centric humanitarian apps often tag pins with short codes (resource, site, report). The open stack keeps **`Place.data`** authoritative; hosts translate markers using a **declarative crosswalk**.

**File:** [`conf/hr-marker-crosswalk.yaml`](../../conf/hr-marker-crosswalk.yaml)

| Section | Maps to |
| --- | --- |
| `reports[]` | `situation` unit slug (`flood`, `field-damage`, …) |
| `sites[]` | situation **`role`** on spaces/openings/markers (`shelter`, …) |
| `resources[]` | `assets[].ext` keys (`shelter_resource`, `relief_resource`) |

**CI:** `check-role-vocab.mjs` validates report situations exist and site roles are in [`role-vocabulary.yaml`](../../conf/role-vocabulary.yaml).

Relief stock on a twin is **declarative** (see golden [`arena` concourse](../../../catalog/place/examples/arena/parts/concourse/) assets). Live inventory sync stays on the host.
