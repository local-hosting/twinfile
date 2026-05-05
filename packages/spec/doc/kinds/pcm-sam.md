# Character and story wire contracts

Unlike place/resource/event JSON Schema wires under `schemas/1/`, **character** and **story** twins serialize through the persona planes:

| Type | Contract | Source (monorepo) |
| --- | --- | --- |
| **character** | PCM + JSM (`toJSON` / `fromJSON`) | `character/src/contract/persona`, `…/situations` (`/pcm`, `/jsm` exports) |
| **story** | SAM | `story/src/contract/narrative` (`/sam` export) |

Layout: [type-package-layout.md](../type-package-layout.md).

Head files: **`Character.yaml`** and **`Story.yaml`**. **`disclosure:`** on character is required (synthetic personas only).