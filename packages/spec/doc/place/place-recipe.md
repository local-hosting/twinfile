# Place recipe (Dockerfile style)

Declare a place **top to bottom** like a Dockerfile: inherit a **base image**, set **layout env**, then **patch layers** coarse → fine. Indoor and outdoor program on one site is **not** a separate `FROM` — set **`exposure`** on each space.

See also [Composition](../build/composition.md) (unit-level `from:` / `layers:`), [Place layers](place.md) (field definitions), and [Campus → building → floor](campus-building-floor.md) (RFC 0009 patterns).

## Instruction cheat sheet

| Dockerfile | Twinfile | Declares |
| --- | --- | --- |
| `FROM image` | **`from:`** on `<unit>.twin.yaml` | Map-shape skeleton (`base-campus`, `base-indoor-stack`, …) |
| `ENV KEY=val` | **`place/place.yaml`** → `authoring_scale` | Units, H3, default space grain (`room` / `zone` / `building`) |
| `LABEL` / image metadata | **`place/place.yaml`** → `name`, `kind`, `ext`, `footprint` | Site identity and anchor on the map |
| **Layout mode** (one per place) | **`place/place.yaml`** → **`archetype`** | Which layout rules `@doppler-group/twinfile-core` enforces (see below) |
| `COPY` / patch files | **`layers:`** on `<unit>.twin.yaml` | Merge order for `place/*.yaml` (coarse → fine) |
| `COPY --from=stage` | **`copy: ./parts/<name>`** with `into:` | Copy a nested building (or floor) Twinfile under a site anchor id ([RFC 0009](../../rfcs/0009-dockerfile-model/index.md)) |
| Runtime config | **`spaces[]`**, **`openings`**, **`visits`** | Graph, connectivity, default path |
| Per-process flags | **`spaces[].exposure`** | `indoor`, `outdoor`, `covered`, … on **each** zone |

**`twin init place <dir> --geotype <slug>`** writes `from:`, `geotype:`, starter **`place/place.yaml`** (scaffold **`archetype`** + **`authoring_scale`** from `@doppler-group/geotypes`), and a **`layers:`** list. When **`suggestBuildingImportForSlug(slug)`** is true (today: resolved **`campus`** archetype — see `suggest_building_import` in `@doppler-group/geotypes` rules), init also writes **`place/BUILDINGS.md`** (RFC 0009 nested-building checklist). Edit the recipe; override **`archetype`** when your story is finer than the map default.

## Two questions → one `archetype`

Authors can think in two steps; **`place.archetype`** remains a **single enum** (validation profile + base pick). Derive it before you write YAML:

| Step | Question | Values |
| --- | --- | --- |
| 1 — **Map surface** | What do maps show **first**? | **path** · **pin** · **site** |
| 2 — **Vertical** (only if map = **pin**) | Do you model **floors maps hide**? | **flat** · **stacked** |

| Map surface | Vertical | → **`archetype`** |
| --- | --- | --- |
| path | — | `linear` |
| site | — | `campus` |
| pin | flat | `single_level` |
| pin | stacked | `indoor_stack` |

**Site + indoor buildings + outdoor plazas** → **`campus`** with **`exposure`** per space (not `indoor_stack`). **Indoor theme park** → **`campus`**, not “indoor archetype.”

This table covers the original four bases. The full three-axis model (adds **movement**, plus **`open_area`**) is in [Place archetypes](place-archetypes.md).

## Minimal recipes (copy patterns)

### Site with indoor and outdoor (expo, airport, park)

**`<unit>.twin.yaml`**

```yaml
from: twinfile/base-campus:0.1.0   # FROM — campus skeleton (indoor + outdoor zones)

twinfile: 1
kind: place
name: my-expo
geotype:
  primary: convention_center
  registry: "@doppler-group/geotypes@0.2.0"
layers:
  - place/place.yaml      # LAYOUT + site ext
  - place/visits.yaml     # default tour beats
  - place/spaces.yaml     # zones: exposure indoor | outdoor | covered
  - place/openings.yaml   # doors / passages between zones
```

**`place/place.yaml`**

```yaml
place:
  name: My expo site
  kind: expo
  timezone: UTC
  archetype: campus                    # map surface = site
  authoring_scale:
    linear_unit: m
    h3_resolution: 9
    space_granularity: zone            # ENV — district grain
  ext:
    lat: 24.96
    lon: 55.15
```

### One pin, multi-floor interior (shop story, hotel tower)

```yaml
from: twinfile/base-indoor-stack:0.1.0   # FROM — levels + level-required spaces

place:
  archetype: indoor_stack              # map = pin, vertical = stacked
  authoring_scale:
    space_granularity: room
  ext: { lat: 40.758, lon: -73.9855 }
```

Every **`spaces[]`** row needs **`level`**. Outdoor/covered plazas at **`level: ground`** are allowed.

### Path / corridor

```yaml
from: twinfile/base-linear:0.1.0

place:
  archetype: linear                      # map surface = path
  authoring_scale:
    space_granularity: zone
```

Every **`spaces[]`** row needs **`visit_order`**.

### Single building, one floor plan

```yaml
from: twinfile/base-single-level:0.1.0

place:
  archetype: single_level                # map = pin, vertical = flat
  authoring_scale:
    space_granularity: room
```

At most **one** row in **`levels.yaml`** when levels are used.

## Layer order (like `COPY` stacking)

Write **`<unit>.twin.yaml` `layers:`** coarse → fine ([layout navigation](layout-navigation.md)):

1. **`place/place.yaml`** — layout mode + scale + site anchor  
2. **`place/visits.yaml`** — overview path (optional)  
3. **`place/levels.yaml`** — floor ids (when using levels)  
4. **`place/spaces.yaml`** (and `spaces-*.yaml`) — zones → rooms  
5. **`place/openings.yaml`**, **`place/routes.yaml`** — connectivity  
6. Finer **`place/assets.yaml`**, **`sensors.yaml`**, …  

**`exposure`** is declared **on each space** in spaces layers — the Dockerfile-style “flags” for indoor vs outdoor, independent of **`archetype`**.

## Other steps (when you need them)

The **minimal runnable layout recipe** is **`from:`** + **`place/place.yaml`** (`archetype`, `authoring_scale`, site anchor) + at least one **`spaces`** layer. Everything below is **optional** for `twin build` on a place unit, but common in real units:

| Step | Twinfile | Docker analogy | When |
| --- | --- | --- | --- |
| **Registry pin** | `geotype.primary` + `registry` on `<unit>.twin.yaml` | Base image label / SBOM component | `twin init --geotype`; ties unit to `@doppler-group/geotypes` |
| **Event hooks** | `bindings/*.yaml` in **`layers:`** | `HEALTHCHECK` / sidecar config | Scenarios need role → space bindings; base role tags or local plan paths ([compose order](../build/composition.md#authoring-compose-order-canonical)) |
| **Map geometry** | **`sources/`** + **`geometry.ref`** on spaces | Mount external volume | Optional; builds MUST NOT require geometry |
| **Human + agent map** | **`docs/layout.md`**, **`ext/layout-index.yaml`** | README in image | Large sites; read before full `spaces` scan ([checklist](layout-navigation.md#checklist-for-a-new-large-place)) |
| **Hierarchy** | **`spaces[].parent`** | Nested cgroup / path prefix | Rollups zone → building → room |
| **Clock** | **`tracks.yaml`**, **`schedules.yaml`** | Cron / lifecycle | Time-varying scenarios ([Time](time.md)) |
| **Run image** | Story scene **`run.yaml`** (`from:` place ref) | `docker compose` service | Exercises place + events + **`args:`** — not part of place layout recipe |
| **Build / ship** | **`twin build`**, **`<unit>.twin.lock`**, **`twin pack`** / push | `docker build` / `push` | Artifact + layer chain ([Composition](../build/composition.md#what-twin-build-records)) |

You do **not** need extra archetype steps for indoor and outdoor on one site — only **`exposure`** (and **`openings`**) on spaces. You do **not** need a composed `layout.map` + `layout.vertical` field in YAML today; derive **`archetype`** from the two-question table and write it on **`place`**.

## Overrides (when geotype ≠ your story)

| Event | Recipe change |
| --- | --- |
| Geotype suggests `campus`, you only model one floor in one building | Keep **`from: base-campus`** or switch to **`base-single-level`**; set **`archetype: single_level`** |
| Geotype suggests `single_level`, you need floor-by-floor nav | **`from: base-indoor-stack`**, **`archetype: indoor_stack`**, add **`levels.yaml`** |
| Outdoor property with many indoor pavilions | **`archetype: campus`**, indoor pavilions as spaces with **`exposure: indoor`** + **`openings`** |

Golden examples: [`examples/expo`](../../../../catalog/place/examples/expo/) (**campus** with indoor and outdoor spaces), [`examples/shop`](../../../../catalog/place/examples/shop/) (**indoor_stack** mall story).

**Customize by combining catalog elements** (bases, events, assets): [Decorate a twin](decorate-twin.md).

## Inspect the stack

```bash
twin layers path/to/unit
twin build path/to/unit
```

Compose history: [Composition](../build/composition.md#what-twin-build-records).
