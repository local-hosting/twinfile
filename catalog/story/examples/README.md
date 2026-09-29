# Story examples

**`<unit>.twin.yaml`** planned-process twins. Each unit is `story/examples/<id>/` → `twinfile/story/<id>:<ver>`.

Tag every story with **`mode: daily`** or **`mode: resilience`** (same enum as events). Keep those modes in separate story units — do not mix hazard/shelter runs into a daily operations arc.

| Mode | Count | Stories |
| --- | --- | --- |
| **daily** | 18 | `airport-operations`, `aquarium-operations`, `arena-operations`, `cold-chain-operations`, `electronics-visit`, `expo-operations`, `falls-day-tour`, `mobility-hub-operations`, `morning-crossing`, `museum-operations`, `online-visit`, `park-operations`, `port-operations`, `river-operations`, `school-operations`, `shop-visit`, `transit-hub-campus-operations`, `wireless-visit` |
| **resilience** | 15 | `airport-resilience`, `aquarium-resilience`, `arena-resilience`, `cold-chain-resilience`, `expo-resilience`, `harbor-resilience`, `mobility-hub-resilience`, `museum-resilience`, `park-resilience`, `port-resilience`, `river-resilience`, `school-resilience`, `shop-resilience`, `transit-hub-campus-resilience`, `wireless-queue-stress` |

watershed Chattanooga stories (`watershed-river-operations`, `watershed-river-resilience`) live in `@local-hosting/overlay-pack`.

| Place theme | Daily | Resilience |
| --- | --- | --- |
| airport | `airport-operations` | `airport-resilience` |
| aquarium | `aquarium-operations` | `aquarium-resilience` |
| arena | `arena-operations` | `arena-resilience` |
| expo | `expo-operations` | `expo-resilience` |
| museum | `museum-operations` | `museum-resilience` |
| school | `school-operations` | `school-resilience` |
| park | `park-operations` | `park-resilience` |
| port | `port-operations` | `port-resilience` |
| cold-chain (hub + airport + port) | `cold-chain-operations` | `cold-chain-resilience` |
| river | `river-operations` | `river-resilience` |
| shop | `shop-visit` | `shop-resilience` |
| wireless-mobile | `wireless-visit` | `wireless-queue-stress` |
| electronics-store | `electronics-visit` | — |
| waterfront | `morning-crossing`, `falls-day-tour` | `harbor-resilience` |
| mobility hub (King's Cross) | `mobility-hub-operations` | `mobility-hub-resilience` |
| transit hub campus | `transit-hub-campus-operations` | `transit-hub-campus-resilience` |

**Runs:** inline `run:` on `story.scenes[]` — `twin run catalog/story/examples/<story>#<scene-id>`.
