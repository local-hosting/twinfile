import { CHARACTER_GROUP_FIELD_KEYS } from '../schemas/character-persona.schema.js';
import { CharacterSchema } from '../schemas/character.schema.js';
import type { Character } from '../types/character.js';

export type ValidateCharacterResult = { ok: true; character: Character } | { ok: false; issues: string[] };

function groupFieldIssues(persona: Record<string, unknown>): string[] {
  const issues: string[] = [];
  for (const key of CHARACTER_GROUP_FIELD_KEYS) {
    if (persona[key] !== undefined) {
      issues.push(
        `persona.${key} is product/cohort metadata — remove from Character (set on AXM audiences/cohorts)`,
      );
    }
  }
  return issues;
}

export function validateCharacter(character: Character): ValidateCharacterResult {
  const groupIssues = groupFieldIssues(character.persona as Record<string, unknown>);
  if (groupIssues.length > 0) {
    return { ok: false, issues: groupIssues };
  }

  const parsed = CharacterSchema.safeParse(character);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }
  const data = parsed.data as Character;
  if (data.persona.id && data.id && data.persona.id !== data.id) {
    return {
      ok: false,
      issues: [`character.id (${data.id}) must match persona.id (${data.persona.id})`],
    };
  }
  return { ok: true, character: data };
}
