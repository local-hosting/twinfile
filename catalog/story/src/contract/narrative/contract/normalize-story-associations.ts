import type { StoryCharacterRef } from '../types/story-refs.js';

function bindingRecord(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const binding = raw.binding;
  return binding && typeof binding === 'object' && !Array.isArray(binding)
    ? (binding as Record<string, unknown>)
    : undefined;
}

/** Ensure `characters` lists every focal Character; default from `binding.characterId`. */
export function normalizeStoryAssociations(raw: Record<string, unknown>): Record<string, unknown> {
  const binding = bindingRecord(raw);
  const characterId = typeof binding?.characterId === 'string' ? binding.characterId.trim() : '';

  let characters = raw.characters;
  if (!Array.isArray(characters) || characters.length === 0) {
    if (!characterId) {
      return raw;
    }
    return {
      ...raw,
      characters: [{ characterId, primary: true } satisfies StoryCharacterRef],
    };
  }

  const normalized = characters
    .filter((row) => row && typeof row === 'object')
    .map((row) => row as StoryCharacterRef);

  if (!characterId) {
    return { ...raw, characters: normalized };
  }

  const hasFocal = normalized.some((row) => row.characterId === characterId);
  if (hasFocal) {
    return { ...raw, characters: normalized };
  }

  return {
    ...raw,
    characters: [{ characterId, primary: true }, ...normalized],
  };
}
