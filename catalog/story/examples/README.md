# Story examples

**`<unit>.twin.yaml`** planned-process twins. Each unit is `story/examples/<id>/` → `twinfile/story/<id>:<ver>`.

Tag every story with **`mode: daily`** or **`mode: resilience`** (same enum as events). Keep those modes in separate story units — do not mix hazard/shelter runs into a daily operations arc.

| Mode | Stories |
| --- | --- |
| **daily** | `airport-operations`, `arena-operations`, `expo-operations`, `falls-day-tour`, `mobility-hub-operations`, `morning-crossing`, `park-operations`, `port-operations`, `shop-visit`, `transit-hub-campus-operations` |
| **resilience** | `airport-resilience`, `arena-resilience`, `expo-resilience`, `harbor-resilience`, `park-resilience`, `port-resilience`, `river-resilience`, `shop-resilience` |

| Place theme | Daily | Resilience |
| --- | --- | --- |
| airport | `airport-operations` | `airport-resilience` |
| arena | `arena-operations` | `arena-resilience` |
| expo | `expo-operations` | `expo-resilience` |
| park | `park-operations` | `park-resilience` |
| port | `port-operations` | `port-resilience` |
| river | — | `river-resilience` |
| shop | `shop-visit` | `shop-resilience` |
| waterfront | `morning-crossing`, `falls-day-tour` | `harbor-resilience` |
| mobility / campus | `mobility-hub-operations`, `transit-hub-campus-operations` | — |

**Runs:** inline `run:` on `story.scenes[]` — `twin run catalog/story/examples/<story>#<scene-id>`.
