# Story examples

**`<unit>.twin.yaml`** planned-process twins. Each unit is `story/examples/<id>/` → `twinfile/story/<id>:<ver>`.

Tag every story with **`mode: daily`** or **`mode: resilience`** (same enum as events). Keep those modes in separate story units — do not mix hazard/shelter runs into a daily operations arc.

| Mode | Count | Stories |
| --- | --- | --- |
| **daily** | 11 | `airport-operations`, `arena-operations`, `expo-operations`, `falls-day-tour`, `mobility-hub-operations`, `morning-crossing`, `park-operations`, `port-operations`, `river-operations`, `shop-visit`, `transit-hub-campus-operations` |
| **resilience** | 10 | `airport-resilience`, `arena-resilience`, `expo-resilience`, `harbor-resilience`, `mobility-hub-resilience`, `park-resilience`, `port-resilience`, `river-resilience`, `shop-resilience`, `transit-hub-campus-resilience` |

| Place theme | Daily | Resilience |
| --- | --- | --- |
| airport | `airport-operations` | `airport-resilience` |
| arena | `arena-operations` | `arena-resilience` |
| expo | `expo-operations` | `expo-resilience` |
| park | `park-operations` | `park-resilience` |
| port | `port-operations` | `port-resilience` |
| river | `river-operations` | `river-resilience` |
| shop | `shop-visit` | `shop-resilience` |
| waterfront | `morning-crossing`, `falls-day-tour` | `harbor-resilience` |
| mobility hub (King's Cross) | `mobility-hub-operations` | `mobility-hub-resilience` |
| transit hub campus | `transit-hub-campus-operations` | `transit-hub-campus-resilience` |

**Runs:** inline `run:` on `story.scenes[]` — `twin run catalog/story/examples/<story>#<scene-id>`.
