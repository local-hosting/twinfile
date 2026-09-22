import type { CharacterPersona } from '../types/character-persona.js';
import type { Persona } from '../types/strategy/persona.js';
import { CHARACTER_GROUP_FIELD_KEYS } from '../schemas/character-persona.schema.js';

/** Drop AXM/cohort fields if present in authored YAML before Character validation. */
export function stripCharacterGroupFields(persona: Persona): CharacterPersona {
  const out = { ...persona } as Record<string, unknown>;
  for (const key of CHARACTER_GROUP_FIELD_KEYS) {
    delete out[key];
  }
  delete out.primary;
  return out as CharacterPersona;
}
