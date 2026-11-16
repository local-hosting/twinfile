# Standards mapping

Twinfile units are **digital models** (authoring artifacts). Under [ISO/IEC 30173](https://www.iso.org/standard/81442.html), a live digital twin also requires a host **data connection** and session — lockers, feeds, and players stay outside this repository.

| ISO 30173 term | Twinfile |
| --- | --- |
| Reusable definition | Published unit (`twinfile/<type>/<id>:<ver>` + OCI digest) |
| Bound running copy | Host session (live player / runner) |

## ISO 23247 elements → four twin types

| ISO 23247 | Twinfile type | Head |
| --- | --- | --- |
| Facility, environment | **place** | `Place.yaml` |
| Equipment, material, product | **resource** | `Resource.yaml` |
| Personnel | **character** | `Character.yaml` + `disclosure:` |
| Process (planned) | **story** | `Story.yaml` |

**Process (actual)** maps to the host **player** + scene **`run.yaml`** presets and simulator **catalog** situations/timetable modules (`twinfile/situation/*`, `twinfile/event/*` compose refs) — not a fifth published twin kind.

## Cross-cutting identifiers

- **IRI:** `urn:twinfile:<type>:<id>:<ver>` (logical twin identity alongside `twinfile/<type>/<id>:<ver>`).
- **JSON-LD:** [`context/1.jsonld`](../context/1.jsonld) for place JSON-LD export (`twin export jsonld`).
- **`links:`** (planned): typed cross-type edges — `locatedIn`, `operates`, `involves`.
- **`disclosure:`** (DTPR): required on **character** twins (synthetic personas only).

## Bridges by type

| Type | Built-ins (today) |
| --- | --- |
| place | IMDF, IndoorGML, IFC, BOT, glTF |
| resource | Brick, SOSA |
| *(catalog / runs)* | GTFS bridges target timetable **stage packs** in the simulator catalog |
| story | *(BPMN planned)* |
| character | *(none — PCM JSON contract)* |