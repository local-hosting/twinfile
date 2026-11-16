# Character and story wire contracts

Unlike place/resource/event JSON Schema wires under `schemas/1/`, **character** and **story** twins serialize through type-package contracts:

| Type | Contract | Source (monorepo) |
| --- | --- | --- |
| **character** | Persona + situations (`toJSON` / `fromJSON`) | `character/src/contract/persona`, `…/situations` (npm subpaths `/pcm`, `/jsm` — path names only) |
| **story** | Narrative | `story/src/contract/narrative` (npm subpath `/sam` — path name only) |

Layout: [type-package-layout.md](../type-package-layout.md).

Heads: **`<unit>.twin.yaml`** with `kind: character` or `kind: story`. **`disclosure:`** on character is required (synthetic personas only).
