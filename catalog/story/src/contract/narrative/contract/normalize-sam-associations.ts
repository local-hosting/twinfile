import type { SAMCharacterRef } from '../types/sam-refs.js';

function bindingRecord(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const binding = raw.binding;
  return binding && typeof binding === 'object' && !Array.isArray(binding)
    ? (binding as Record<string, unknown>)
    : undefined;
}

/** Ensure `characters` lists every focal PCM; default from `binding.pcmId`. */
export function normalizeSAMAssociations(raw: Record<string, unknown>): Record<string, unknown> {
  const binding = bindingRecord(raw);
  const pcmId = typeof binding?.pcmId === 'string' ? binding.pcmId.trim() : '';

  let characters = raw.characters;
  if (!Array.isArray(characters) || characters.length === 0) {
    if (!pcmId) {
      return raw;
    }
    return {
      ...raw,
      characters: [{ pcmId, primary: true } satisfies SAMCharacterRef],
    };
  }

  const normalized = characters
    .filter((row) => row && typeof row === 'object')
    .map((row) => row as SAMCharacterRef);

  if (!pcmId) {
    return { ...raw, characters: normalized };
  }

  const hasFocal = normalized.some((row) => row.pcmId === pcmId);
  if (hasFocal) {
    return { ...raw, characters: normalized };
  }

  return {
    ...raw,
    characters: [{ pcmId, primary: true }, ...normalized],
  };
}
