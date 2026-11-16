import { PCM_GROUP_FIELD_KEYS } from '../schemas/pcm-character.schema.js';
import { PCMSchema } from '../schemas/pcm.schema.js';
import type { PCM } from '../types/pcm.js';

export type ValidatePCMResult = { ok: true; pcm: PCM } | { ok: false; issues: string[] };

function groupFieldIssues(persona: Record<string, unknown>): string[] {
  const issues: string[] = [];
  for (const key of PCM_GROUP_FIELD_KEYS) {
    if (persona[key] !== undefined) {
      issues.push(
        `persona.${key} is product/cohort metadata — remove from PCM (set on AXM audiences/cohorts)`,
      );
    }
  }
  return issues;
}

export function validatePCM(pcm: PCM): ValidatePCMResult {
  const groupIssues = groupFieldIssues(pcm.persona as Record<string, unknown>);
  if (groupIssues.length > 0) {
    return { ok: false, issues: groupIssues };
  }

  const parsed = PCMSchema.safeParse(pcm);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }
  const data = parsed.data as PCM;
  if (data.persona.id && data.id && data.persona.id !== data.id) {
    return {
      ok: false,
      issues: [`pcm.id (${data.id}) must match persona.id (${data.persona.id})`],
    };
  }
  return { ok: true, pcm: data };
}
