import type { Character } from '../types/character.js';
import { characterCatalogLabel } from '../contract/character-catalog-display.js';

/** Resolve a story-instance display name from Character persona fields and optional override. */
export function resolveCharacterDisplayName(character: Character, displayNameOverride?: string): string {
  const override = displayNameOverride?.trim();
  if (override) return override;
  return characterCatalogLabel(character);
}
