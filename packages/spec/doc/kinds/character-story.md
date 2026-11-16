# Character and story wire contracts

Unlike place/resource/event JSON Schema wires under `schemas/1/`, **character** and **story** twins serialize through type-package contracts:

| Type | Contract | Source (monorepo) |
| --- | --- | --- |
| **character** | Persona (`toJSON` / `fromJSON`) | `character/src/contract/persona` (npm subpath `/persona`) |
| **context** | JTBD packs | `context/src/contract` — `@doppler-group/twinfile-context` |
| **story** | Narrative | `story/src/contract/narrative` (npm subpath `/narrative` — path name only) |

Layout: [type-package-layout.md](../type-package-layout.md).

Heads: **`<unit>.twin.yaml`** with `kind: character` or `kind: story`. **`disclosure:`** on character is required (synthetic personas only).

Character dramaturgy (Personality tab) lives on **`character.personality`** / `persona.personality` as **`CharacterPersonality`**: `wants`, `fears`, `flaw`, `delivery` (`patterns` + `lines`), `movement`, `temperament`, `moods`, `signatureMoves`, plus poster-rail **`traits`**. Distinct from JTBD `goals` / `frustrations` and empathy think/feel/say/do.
