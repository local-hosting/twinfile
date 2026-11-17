import type { Character } from '../types/character.js';

/** Org catalog id for a mounted Character (`persona.id` or document `id`). */
export function characterCatalogId(character: Character): string {
  return character.persona?.id?.trim() || character.id.trim();
}

/** Display label for org persona lists and MCP formatters. */
export function characterCatalogLabel(character: Character): string {
  const characterId = characterCatalogId(character);
  return (
    character.persona?.label?.trim() ||
    character.persona?.exemplar?.name?.trim() ||
    character.title?.trim() ||
    characterId
  );
}

/** Persona segment token for catalog tables (may be empty). */
export function characterCatalogSegment(character: Character): string {
  return character.persona?.segment?.trim() ?? '';
}
