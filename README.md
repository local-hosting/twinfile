# Twinfile

**local-hosting/twinfile** — one monorepo for the Twinfile open stack: **four twin types** (**place, resource, character, story**). Scene **runs** are inline `run:` blocks on `story.scenes[]` in `catalog/story/examples/`; the **player** (`packages/simulator`) executes stories.

**Twinfile** is a Dockerfile-style recipe for a place you can build, pin, publish, and talk to — without a closed host to author or validate units.

## Repository layout

```text
twinfile/
  catalog/                    # twin types, golden content
  packages/                   # kernel, simulator, site, tooling
```

| Area | Path | Role |
| --- | --- | --- |
| **Catalog** | [`catalog/<type>/`](catalog/) | `@local-hosting/twinfile-<type>` + `examples/` |
| **Kernel** | [`packages/spec|core|cli|bridge/`](packages/) | Format, load/merge, CLI, bridges |
| **Simulator** | [`packages/simulator/`](packages/simulator/) | Playback, events (not a catalog type) |
| **Site** | [`packages/site/`](packages/site/) | [twinfile.org](https://twinfile.org) |
| **Tooling** | [`packages/tooling/`](packages/tooling/) | `check:twinfile`, hygiene, sync scripts |

Layout: [`catalog/README.md`](catalog/README.md). Agent map: [`AGENTS.md`](AGENTS.md).

Sibling repos (portal deps): **`../geotypes`**, **`../../local-hosting/geokit`**, **`../../local-hosting/geokit-swift`**, **`../frameworks`**.

## Quick start

```bash
cd ~/Documents/GitHub/local-hosting/twinfile
yarn install
yarn run check:twinfile
yarn workbench    # golden catalog → http://localhost:4173
```

```bash
yarn workspace @local-hosting/twinfile-cli build
yarn twin check catalog/place/examples/shop
yarn twin build catalog/place/examples/shop
yarn twin summary catalog/place/examples/shop
yarn twin describe catalog/place/examples/shop --t 0
yarn twin serve catalog/place/examples/shop --stdio   # MCP for agents
```

Explore **`catalog/place/examples/`** in the browser with **`yarn workbench`**, or on the CLI with **`twin summary`**, **`twin layout summary`**, **`twin query`**, **`twin describe`**, and **`twin serve --stdio`** ([MCP](packages/spec/doc/pack/mcp.md)).

Resolve example places in code:

```ts
import { resolveExamplePlace, listExamplePlaceRefs, buildTwinfile } from '@local-hosting/twinfile-core';

const root = process.env.TF_TWINFILE_ROOT ?? '/path/to/twinfile';
const examplesRoot = `${root}/catalog/place/examples`;
const place = resolveExamplePlace('twinfile/shop:0.2.0', { examplesRoot });
const built = await buildTwinfile(place.rootDir, { examplesRoot });
```

Local ref overrides: [`catalog/place/examples/twin.local.yaml`](catalog/place/examples/twin.local.yaml); golden digests in [`published-refs.json`](catalog/place/examples/published-refs.json). Ops env: **`TF_TWINFILE_ROOT`** only, when running from outside the repo; every catalog path derives from it (see [glossary — repository layout](packages/spec/doc/glossary.md#repository-layout-prose)).

Hygiene: `yarn hygiene` (`packages/tooling/scripts/repo-hygiene.mjs`).

## CI gates

| Script | Scope |
| --- | --- |
| **`yarn run check`** / **`yarn run check:twinfile`** | Open stack — spec, core, golden catalog, conformance |

See [`packages/site/STACK.md`](packages/site/STACK.md) and [`packages/site/ROADMAP.md`](packages/site/ROADMAP.md). CI: [`.github/README.md`](.github/README.md).

**Published docs:** [twinfile.org](https://twinfile.org) — app at [`packages/site/`](packages/site/) (`yarn workspace @local-hosting/twinfile-docs dev`). Accord Labs site: [`../accord-labs/accord.fm`](../accord-labs/accord.fm) (`cd ../accord-labs/accord.fm && yarn dev`).

## Where this stack sits

Classification and simulation are different packages.

**`../geotypes` classifies.** A registry slug (`hotel`, `public_park`, `fire_hydrant`) resolves to three axes — extent, vertical, movement — and those axes look up one archetype (`single_level`, `indoor_stack`, `campus`, `open_area`, `linear`). `placeScaffoldForSlug` returns the archetype and a suggested `authoring_scale`. `placeDecorationsForSlug` suggests events and layer files. `isAssetGeotype` marks a point with no interior (hydrant, meter, pole) as an asset row, not a place. Provider crosswalks cover Foursquare, Google, OSM, and HERE. The map picture is the oracle: a pin, a site boundary, open land, or a line.

**Twinfile builds the simulation for that class.** A place unit records the archetype geotypes already resolved and inherits a golden base (`from: twinfile/base-campus:0.1.0` and the other `base-*` units). `@local-hosting/twinfile-core` checks the archetype's axes at load (stacked places set `level` on every space, sequenced places set `visit_order`). A scenario then stacks portable units in a fixed order: place, events, plan role bindings, scenario patches, args ([RFC 0001](packages/spec/rfcs/0001-five-layers.md)). An event names phases and the roles it expects. A plan binds those roles to this place. A runner reads the built bundle and writes a timeline ([Runners](packages/spec/doc/pack/runners.md)). Indoor, covered, and outdoor stay on each space as `exposure`. Geometry is a reference.

Axis rules are written in the spec ([Place archetypes](packages/spec/doc/place/place-archetypes.md)) and executed in `@local-hosting/geotypes`. Field-level crosswalks to IMDF, BOT, Brick, SOSA, GTFS, and DTPR stay in the [appendix](packages/spec/doc/map/appendix.md).

| Precedent | What it standardizes | Geotypes (classify) | Twinfile (build the simulation) |
| --- | --- | --- | --- |
| [ISO/IEC 30173:2023](https://www.iso.org/standard/81442.html) | Shared digital-twin terms | A slug registry, not a terminology standard | A portable place unit plus a scenario run |
| [ISO 23247-1:2021](https://www.iso.org/standard/75066.html) | Manufacturing elements and shop-floor sync | Place and asset slugs from maps, not factory element classes | Events composed like container images, then handed to an external runner |
| [IEC 63278-1](https://webstore.iec.ch/en/publication/65628) Asset Administration Shell | Typed industrial assets and submodels | Asset slugs are map points with no interior | OCI units and `copy:` steps; the contract is a place and its plans |
| [Microsoft DTDL](https://github.com/Azure/opendigitaltwins-dtdl) | Device interfaces on a twin graph | Slug, axes, archetype | YAML layers and event `expects` |
| [OGC CityGML 3.0](https://www.ogc.org/standards/citygml/) | Semantic 3D city objects, LoD, versioning; Dynamizers hang time series on attributes | Five archetypes from map extent, not thematic city modules or LoD | Scenario clock, tracks, and event phases |
| [ISO 16739 IFC](https://technical.buildingsmart.org/standards/ifc/) | Site, building, storey, space, and product classes | Archetype plus suggested scale; no product taxonomy | Spaces and levels checked against the archetype; product geometry stays outside the bundle |
| [OGC IndoorGML](https://www.ogc.org/standards/indoorgml/) | Indoor **CellSpace** and dual **State** / **Transition** network | Movement axis: `free` or `sequenced` | `spaces[]` (cells), `openings[]` (transitions), `routes[]` (state paths); **`indoorgml` bridge** (`twinfile.bridge.indoorgml.v1` JSON) |
| [OGC IMDF](https://www.ogc.org/standards/indoor-mapping-data-format/) | Venue, level, unit, opening, amenity categories | Extent and vertical decide whether the place is a footprint, a stack, or a site | `levels`, `spaces`, `openings` authored on the unit |
| [BOT](https://w3c-lbd-cg.github.io/bot/) | Site, building, storey, space, and topology relations | Same spatial scale, expressed as three axes | `levels` and `spaces` with load-time rules for the resolved archetype |
| [Brick](https://brickschema.org/) | Equipment and point classes | Resource slugs and asset slugs; no Brick class tree | `sensors` and `assets` layers; event roles are a separate vocabulary |
| [W3C SOSA](https://www.w3.org/TR/vocab-ssn/) / [OGC SensorThings](https://www.ogc.org/standards/sensorthings/) | Sensors, observed properties, datastreams | Sensor-bearing categories suggest a `sensors` layer | Sensor rows on the place; a runner reads them on the scenario clock. Published sensors carry [DTPR](packages/spec/doc/gov/transparency.md) disclosures |
| [ETSI NGSI-LD](https://www.etsi.org/committee/cim) | Context entity types and subscriptions | Registry slugs and provider crosswalks | Unit refs, built and digested, then run |
| [FMI](https://fmi-standard.org/) | Numerical model exchange and co-simulation | — | The runner is the solver. The bundle is the scenario contract it reads |
| [IEEE 1516 HLA](https://standards.ieee.org/standard/1516-2010.html) | Federated simulators and managed time | — | One bundle, one runner. Composition is an authoring-time merge |

## Research precedents

Standards above are the normative neighbors. These are the papers and earlier frameworks behind the two packages.

### What a digital twin is

- Grieves, M., & Vickers, J. (2017). Digital twin: Mitigating unpredictable, undesirable emergent behavior in complex systems. In *Transdisciplinary Perspectives on Complex Systems*. Springer. Product-lifecycle twin: a digital representation kept in step with a physical artifact. Twinfile keeps the pairing and drops the factory lifecycle.
- Glaessgen, E., & Stargel, D. (2012). [The digital twin paradigm for future NASA and U.S. Air Force vehicles](https://ntrs.nasa.gov/citations/20120008178). AIAA 2012-1818. Ultra-realistic vehicle simulation fed by vehicle history. Twinfile scenarios are operational stories about a place (weather, a dam release, a transit disruption), not a multiphysics vehicle model.
- Kritzinger, W., Karner, M., Traar, G., Henjes, J., & Sihn, W. (2018). [Digital twin in manufacturing: A categorical literature review and classification](https://doi.org/10.1016/j.ifacol.2018.08.474). *IFAC-PapersOnLine*. Splits digital model, digital shadow, and digital twin by whether data flows one way or both. A Twinfile unit can be built and run with no live feed; a runner that needs a feed and lacks one exits non-zero.
- Tao, F., Zhang, H., Liu, A., & Nee, A. Y. C. (2019). [Digital twin in industry: State-of-the-art](https://doi.org/10.1109/TII.2018.2873186). *IEEE Transactions on Industrial Informatics*. Five-dimension model (physical, virtual, data, service, connection). Twinfile specifies the virtual place and the scenario service; connection to a host stays outside the spec.
- Jones, D., Snider, C., Nassehi, A., Yon, J., & Hicks, B. (2020). [Characterising the digital twin: A systematic literature review](https://doi.org/10.1016/j.cirpj.2020.02.002). *CIRP Journal of Manufacturing Science and Technology*. Themes: physical entity, virtual entity, twinning rate, fidelity. Geotypes suggests fidelity as `authoring_scale` (unit, H3 resolution, room vs zone vs building). The place unit records it. Mesh density stays outside both packages.
- Fuller, A., Fan, Z., Day, C., & Barlow, C. (2020). [Digital twin: Enabling technologies, challenges and open research](https://doi.org/10.1109/ACCESS.2020.2998358). *IEEE Access*. Survey of IoT, AI, and VR stacks behind twins. Twinfile standardizes the unit and the build, and leaves the host stack alone.
- [Digital Twin Consortium](https://www.digitaltwinconsortium.org/) capabilities periodic table. A capability checklist (data, integration, intelligence, UX, security), not a file format. Useful as a coverage map; Twinfile currently covers authoring, composition, digest, and scenario run.

### Classifying places (geotypes)

- OpenStreetMap [map features](https://wiki.openstreetmap.org/wiki/Map_features). Community tags (`amenity`, `building`, `highway`, `natural`, `waterway`) are the de facto global classification of mapped things. Geotypes keeps its own slugs and crosswalks them to OSM, Google, Foursquare, and HERE. The three axes are a projection of that map picture onto five archetypes.
- Biljecki, F., Stoter, J., Ledoux, H., Zlatanova, S., & Çöltekin, A. (2015). [Applications of 3D city models: State of the art review](https://doi.org/10.3390/ijgi4042842). *ISPRS International Journal of Geo-Information*. Catalog of CityGML-style uses, including energy, noise, and emergency simulation. Those uses need a city object model. Geotypes starts from the map footprint. Twinfile adds only the layers the suggested event expects.
- Rasmussen, M. H., Lefrançois, M., Schneider, G. F., & Pauwels, P. (2021). [BOT: The building topology ontology of the W3C Linked Building Data group](https://doi.org/10.3233/SW-200385). *Semantic Web*. Minimal site / building / storey / space vocabulary so other graphs can align. Geotypes collapses that scale into extent and vertical. Twinfile authors `levels` and `spaces` for the archetype that lookup returns.
- Balaji, B., et al. (2016). [Brick: Towards a unified metadata schema for buildings](https://doi.org/10.1145/2993422.2993577). *BuildSys '16*. Equipment and sensor-point classes for commercial buildings. Geotypes lists those as resource and asset slugs. Twinfile places them in `sensors` and `assets`.
- Apple Indoor Mapping Data Format, published as the [OGC IMDF Community Standard](https://docs.ogc.org/cs/20-094/index.html). Venue, level, unit, opening. The closest cartographic precedent for the scaffold geotypes emits and the place layers Twinfile authors.
- GeoJSON ([RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)) geometry types (point, polygon, linestring). Geotypes reads extent off that vocabulary: point or one polygon → footprint, polygon of open land → area, linestring → route.

### Binding a story to a place

- CityGML 3.0 Dynamizer and versioning ([OGC CityGML conceptual model](https://www.ogc.org/standards/citygml/)). The main standards-track way to hang time-varying values on an otherwise static city object. Twinfile hangs time on a scenario clock and on event phases instead of on object attributes.
- Modelica Association, [Functional Mock-up Interface](https://fmi-standard.org/). The widely implemented contract for coupling numerical models. Precedent for "the scenario document is not the solver": Twinfile's runner boundary is the same idea, with JSON Lines instead of an FMU.
- IEEE Std 1516, High Level Architecture. Precedent for interoperable simulators and managed time. Twinfile composes units before the run rather than federating simulators during it.
- OASIS [Common Alerting Protocol](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html). A shared alert document (what happened, where, how urgent). Precedent for a reusable event that many places can bind, which Twinfile does with `expects` roles and a local plan.
- [DTPR](https://github.com/helpfulplaces/dtpr) (Digital Trust for Places and Routines). Disclosure pattern for sensors and algorithms in public places. Twinfile lints published places for DTPR on sensors; it is a governance layer, not a spatial one.
