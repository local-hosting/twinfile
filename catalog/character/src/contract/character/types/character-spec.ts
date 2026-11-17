import type { Character } from './character.js';

/** Portable Character contract version implemented by this package. */
export const CHARACTER_SPEC_VERSION = 1;

export type CharacterSpecVersion = typeof CHARACTER_SPEC_VERSION;

export function characterSpecVersion(character: Character): CharacterSpecVersion {
  return character.version;
}

const SUPPORTED_CHARACTER_SPECS = [CHARACTER_SPEC_VERSION] as const;

export function assertSupportedCharacterSpec(version: number): void {
  if (!(SUPPORTED_CHARACTER_SPECS as readonly number[]).includes(version)) {
    throw new Error(
      `Unsupported CharacterSpec ${version} (this package implements CharacterSpec ${SUPPORTED_CHARACTER_SPECS.join(', ')})`,
    );
  }
}
