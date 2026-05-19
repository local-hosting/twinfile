import type { SAM } from '../types/sam.js';

export type ValidateSAMScenesResult = { ok: true } | { ok: false; issues: string[] };

export function validateSAMScenes(sam: SAM): ValidateSAMScenesResult {
  const scenes = sam.scenes;
  if (!scenes?.length) {
    return { ok: true };
  }

  const issues: string[] = [];
  const cast = new Set(sam.characters.map((row) => row.pcmId));
  const venueIds = new Set((sam.venues ?? []).map((row) => row.venueKey));
  const sceneIds = new Set<string>();

  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) {
      issues.push(`duplicate scene id "${scene.id}"`);
    }
    sceneIds.add(scene.id);

    if (!venueIds.has(scene.venueKey)) {
      issues.push(`scene ${scene.id} venueKey "${scene.venueKey}" is not listed on sam.venues`);
    }

    for (const pcmId of scene.characterIds) {
      if (!cast.has(pcmId)) {
        issues.push(`scene ${scene.id} character "${pcmId}" is not listed on sam.characters`);
      }
    }

    for (const beat of scene.cast ?? []) {
      if (!scene.characterIds.includes(beat.pcmId)) {
        issues.push(`scene ${scene.id} cast beat pcmId "${beat.pcmId}" is not in characterIds`);
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
