# Natural hazards and event units

Event units describe **reusable operational stories** (`phases`, `expects` roles). They are not tied to a single hazard brand name. For emergency-management vocabulary, the repo ships a **catalog** that maps common natural hazard types to event slugs.

**Catalog (normative list):** [`conf/hazard-catalog.yaml`](../../conf/hazard-catalog.yaml)

**CI:** `check-role-vocab.mjs` (from `@local-hosting/twinfile` `yarn check`) verifies every catalog `event` has a unit under [`src/catalog/event/examples/`](../../../src/catalog/event/examples/).

**Package:** Shared hazard events live in **`@local-hosting/twinfile/event`** (source under `packages/twinfile/src/catalog/event/`). Compose and the simulator load them from the monorepo via `catalog-layout`.

## Event units (hazard stories)

| Event | Typical hazards | Role focus |
| --- | --- | --- |
| `severe-weather` | Hurricane, tornado, thunderstorm, lightning, hail, winter storm, blizzard, extreme heat, extreme cold, dust storm | Shelter, exits, outdoor program |
| `flood` | River, pluvial, coastal flooding | Refuge, crossing, gauge |
| `dam-release` | Dam failure, controlled release | Launch, refuge, stage gauge |
| `earthquake` | Earthquake | Shelter, exits, survey zone |
| `wildfire` | Wildfire | Shelter, exits, evacuation route |
| `tsunami` | Tsunami | High ground, inland route, coastal lookout |
| `volcanic-ash` | Volcanic eruption / ashfall | Shelter, egress, air-quality monitor |
| `slope-movement` | Avalanche, landslide, lahar | Evac route, high-ground refuge, monitor |
| `drought` | Drought | Reservoir gauge, water pickup, optional relief shelter |
| `power-outage` | Grid failure (any cause) | Shelter, safe egress, backup circulation |
| `field-damage` | Structural damage, debris, closures | Hotspot, safe lane, debris staging |

## Mapping notes

- **Lahar** maps to `slope-movement` for evac/refuge; pair with `volcanic-ash` when ashfall and mudflow both matter on one site.
- **Power outage** is catalogued as a hazard because many place twins need backup egress and assembly roles even when the trigger was ice, wind, or wildfire.
- **Pandemic, hazmat, rip currents** stay outside this catalog (different operational models or weak place-layer fit).

Operational (non-hazard) events: `transit-disruption`, `litter-pollution`.

A place hosts a hazard through the role tags its base already carries; add `bindings/<event>.yaml` to pin it to specific rows — [Decorate a twin](../place/decorate-twin.md).

**Map pin codes:** [Humanitarian crosswalk](hr-marker-crosswalk.md).
