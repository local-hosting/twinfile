import type { PCMCharacter } from '../types/pcm-character.js';
import type { Persona } from '../types/strategy/persona.js';
import { PCM_GROUP_FIELD_KEYS } from '../schemas/pcm-character.schema.js';

/** Drop AXM/cohort fields if present in authored YAML before PCM validation. */
export function stripPersonaGroupFields(persona: Persona): PCMCharacter {
  const out = { ...persona } as Record<string, unknown>;
  for (const key of PCM_GROUP_FIELD_KEYS) {
    delete out[key];
  }
  delete out.primary;
  return out as PCMCharacter;
}
