import { assertSupportedCharacterSpec, CHARACTER_SPEC_VERSION } from '../types/character-spec.js';

function resolveCharacterSpecVersion(raw: Record<string, unknown>): number {
  const fromCharacterSpec = raw.characterSpec;
  const fromVersion = raw.version;
  const specFields = [fromCharacterSpec, fromVersion].filter((value) => value !== undefined);
  if (specFields.length > 1 && new Set(specFields).size > 1) {
    throw new Error(
      `characterSpec (${fromCharacterSpec}) and version (${fromVersion}) must agree (CharacterSpec contract)`,
    );
  }
  const resolved = fromCharacterSpec ?? fromVersion ?? CHARACTER_SPEC_VERSION;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error('characterSpec must be an integer CharacterSpec version');
  }
  return resolved;
}

/** Fold `characterSpec` / legacy `version` → `version`; strip JTBD fields (own on context twins). */
export function normalizeCharacterInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const specVersion = resolveCharacterSpecVersion(raw);
  assertSupportedCharacterSpec(specVersion);
  const {
    characterSpec: _characterSpec,
    userNeeds: _userNeeds,
    jobs: _jobs,
    ...rest
  } = raw;
  return {
    ...rest,
    version: specVersion,
  };
}
