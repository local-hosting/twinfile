# Decorate a twin (combine pre-defined elements)

Customize a digital twin by **stacking published units and YAML patches**—same compose model as [Composition](../build/composition.md), framed for **decoration** rather than greenfield authoring.

**Layout mode** (`archetype`, spaces, exposure) → [Place recipe](place-recipe.md).  
**This page** → **what to stack on top**: skeletons, capability packs, and asset/sensor layers.

## Three element kinds

| Kind | Ref / path | What it adds | Mix via |
| --- | --- | --- | --- |
| **Archetype base** | `twinfile/base-*:0.1.0` | Map-shape skeleton: starter spaces, openings, default **`bindings`** hooks | **`from:`** on place `<unit>.twin.yaml` |
| **Event** | `twinfile/severe-weather:1.0.0`, … | Shared story contract (`phases`, **`expects`** roles) | Scenario **`layers:`** + place **`bindings/*.yaml`** (role → space ids) |
| **Place layer module** | Files under **`place/`** | Patches: extra spaces, assets, sensors, visit moments (`visits`), routes | Child **`layers:`** (merge on top of base) |

Bases and events ship from **`examples`** (OCI / `twin.local.yaml`). Your site only authors **deltas**: rename site, add zones, wire **`bindings`**, drop in **`assets.yaml`**.

## Dockerfile-style decorate recipe

```yaml
# 1) FROM — layout contract (archetype, scale, default levels)
from: twinfile/base-campus:0.1.0

twinfile: 1
kind: place
name: my-site
geotype:
  primary: convention_center
  registry: "@doppler-group/geotypes@0.2.0"

# 2) PATCH — your geometry & narrative (coarse → fine)
layers:
  - place/place.yaml
  - place/spaces.yaml
  - place/openings.yaml
  - place/assets.yaml
  - place/sensors.yaml
  - place/visits.yaml
  - bindings/severe-weather.yaml
  - bindings/transit-disruption.yaml
```

**Run** (inline on a story scene, not a Twinfile) copies event refs at build time:

```yaml
# story/examples/expo-operations/expo-operations.twin.yaml (story.scenes[])
# from: defaults to links involves place (twinfile/place/expo:0.2.0)
- id: outdoor-shelter-cap
  label: Outdoor shelter capacity
  run:
    steps:
      - copy: twinfile/event/severe-weather:1.0.0
    args:
      occupancy: 4200
      target_role: shelter
```

See [Composition](../build/composition.md) for full compose order (place → events → scenario patches → **`args:`**).

## Pre-defined catalog (`examples`)

### Archetype bases (pick one `from:`)

| Ref | Use when |
| --- | --- |
| `twinfile/base-campus:0.1.0` | Multi-building site; `archetype: campus`, zone granularity |
| `twinfile/base-indoor-stack:0.1.0` | One pin, multi-floor; default `levels`, room granularity |
| `twinfile/base-single-level:0.1.0` | One pin, single floor plan |
| `twinfile/base-open-area:0.1.0` | Open land (park, field, farm); outdoor zones, no buildings |
| `twinfile/base-linear:0.1.0` | Path / corridor; **`visit_order`** spaces |

Paths: [`examples/`](../../../../catalog/place/examples/). Map-first pick: [Place archetypes](place-archetypes.md#axes--archetype).

### Events (reuse across places)

| Unit | Role vocabulary (excerpt) | Example places |
| --- | --- | --- |
| `severe-weather` | `shelter`, `exit`, `outdoor` | expo, arena, shop |
| `transit-disruption` | transit-specific roles | shop, airport, expo, transit-hub-campus |
| `dam-release` | water / stage safety | river |
| `flood` | refuge, crossing, gauge | (river/coastal sites) |
| `earthquake` | `shelter`, `exit`, `outdoor` | — |
| `wildfire` | `shelter`, `exit`, `safe-access` | — |
| `tsunami` | refuge, evacuation route | (coastal sites) |
| `volcanic-ash` | `shelter`, `exit`, `survey-station` | — |
| `slope-movement` | `safe-access`, `flood-refuge`, `survey-station` | (avalanche, landslide, lahar) |
| `drought` | `gauge`, `collection-point`, optional `shelter` | — |
| `power-outage` | `shelter`, `safe-access`, `alternative` | (utilities sites) |
| `field-damage` | `hotspot`, `safe-access`, `collection-point` | (post-event reports) |
| `litter-pollution` | outdoor program / cleanup | port, park |

Common **natural hazard** labels map to these units in [`conf/hazard-catalog.yaml`](../../conf/hazard-catalog.yaml) — see [Natural hazards](../kinds/natural-hazards.md).

Paths: [`catalog/event/examples/`](../../../../catalog/event/examples/). Each event **`expects`** roles. A place hosts an event through its own role tags: every expected role is filled by rows of that kind whose `roles` include it. Add **`bindings/<event>.yaml`** only to override that match with explicit ids:

```yaml
for: severe-weather
roles:
  shelter: [concourse]
  exit: [gate-north, gate-south]
```

### Decoration layer files (copy patterns)

| File | Decorates with |
| --- | --- |
| **`place/assets.yaml`** | Devices, kiosks, signage, DTPR metadata |
| **`place/sensors.yaml`** | Sensor placements (when scenarios need them) |
| **`place/ai.yaml`** | Agent / AI bindings (when used) |
| **`place/visits.yaml`** | Visit moments (layout TOC; runtime movement is host-owned) |
| **`place/routes.yaml`** | Named paths between regions |
| **`place/openings.yaml`** | Passages — doors / gates between two spaces (also **`exit`** roles for weather plans) |

Merge rules: RFC 7396 objects; **`id`** arrays merge by **`id`** ([Layers](../build/layers.md)). Add a new asset row in a later layer file to extend without editing the base.

## Hooks: `roles` on spaces

Shared **`bindings`** do not hard-code your ids. Tag spaces (and openings) so plans stay portable:

```yaml
spaces:
  - id: hall-shelter
    exposure: indoor
    roles: [shelter]
  - id: quad-outdoor
    exposure: outdoor
    roles: [outdoor]
```

See [`fixtures/plan-scaffold-campus`](../../../../catalog/place/test/fixtures/plan-scaffold-campus/) for a minimal role-tag sample used by `twin add plan`. Custom places wire events by tagging **their** ids and authoring **`bindings/*.yaml`**.

## Minimal customize paths

| Goal | Mix |
| --- | --- |
| “Campus like the example, different name/coords” | **`from: base-campus`** + patch **`place/place.yaml`** only |
| “Add retail tech to a floor” | Add **`place/assets.yaml`** layer |
| “Enable storm scenario” | Add **`bindings/severe-weather.yaml`** + space **`roles`** + scenario unit |
| “Indoor + outdoor expo” | **`from: base-campus`**, patch spaces/exposure, wire expo-style **`bindings`** ([expo](../../../../catalog/place/examples/expo/)) |

Thin derived examples: [`mobility-hub/campus`](../../../../catalog/place/examples/mobility-hub/campus/) — **`from:`** campus base, `place.kind: mobility_hub`, site `steps:`, **`copy: ./parts/transit-hub`**, **`transit-disruption`** plan. Building + floor: [`places/airport`](../../../../catalog/place/examples/airport/) (the building copies `./floors/airside`). Single building: [`expo`](../../../../catalog/place/examples/expo/), [`arena`](../../../../catalog/place/examples/arena/), [`port`](../../../../catalog/place/examples/port/). **`open_area`** [`park`](../../../../catalog/place/examples/park/) stays site-only ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)). When geotypes **`suggest_building_import`** is true for the resolved archetype (today **`campus`** only), `twin init place --geotype` writes `PARTS.md`.

## Geotype decorations

Every `@doppler-group/geotypes` slug carries suggested decorators next to its archetype ([Place archetypes](place-archetypes.md#decorations)): **`events`** (which shared events to wire) and **`layers`** (decoration layer files such as `assets`, `sensors`, `routes`, `visits`). Look them up with `placeDecorationsForSlug('stadium')`.

**`twin init place <dir> --geotype <slug>`** applies them on top of the golden base (skip with **`--no-decorate`**):

1. **`from:`** the archetype base (role hooks: `shelter`, `exit`, `outdoor`, … already tagged).
2. **`axes:`** for any axis the archetype leaves open (e.g. `vertical: stacked` on a hospital campus).
3. Starter **`assets`** / **`sensors`** rows as `steps:` when suggested (a kiosk and an occupancy sensor to rename and place). Suggested events need no extra rows: the base already tags role hooks, so scenes that copy those events match roles without a binding.
4. Prints remaining suggested layers (`next: add layers …`) that need real geometry (routes, optional visit moments).

To pin an event to specific rows, add a local `bindings/<event>.yaml`.

## CLI (decorate)

From a **place unit** directory:

```bash
# Wire a shared event to your tagged spaces/openings
twin add plan severe-weather

# Starter device/signage layer (edit space ids)
twin add assets
```

`twin add plan` merges the place, matches **`roles:`** tags to each event **`expects`** role, writes **`bindings/<event>.yaml`**, and appends that path to manifest **`layers:`** (via **`twin fmt`**). Fix gaps (`warn:` lines), then **`twin check --strict`**.

## What is not automatic yet

| Desired | Today | Direction |
| --- | --- | --- |
| Pick decorations from a UI | `twin init place --geotype` applies geotype-suggested decorators; otherwise author YAML refs manually | Catalog in examples + this doc; tooling can list refs |
| `twin add plan severe-weather` | **Implemented** — see [Decorate a twin](../place/decorate-twin.md#cli-decorate) | Scaffold **`bindings/`** from event **`expects`** + role tags |
| Multiple **`from:`** bases | Single **`from:`** per place | Chain bases sparingly, or publish composite bases |
| Asset “sprite pack” ref | Patch **`assets.yaml`** or merge layer file | Optional published **`twinfile/decor-retail-kit:*`** place layer bundle |

Decoration **does not** change **`archetype`** rules—stack **layout** (recipe doc) and **behavior/capability** (this doc).

## Related

- [Place recipe](place-recipe.md) — `FROM` + layout + exposure  
- [Composition](../build/composition.md) — merge order and OCI  
- [Layout navigation](layout-navigation.md) — coarse → fine layer files  
- [Golden catalog README](../../../../catalog/place/examples/README.md) — place ↔ event ↔ scenario matrix  
