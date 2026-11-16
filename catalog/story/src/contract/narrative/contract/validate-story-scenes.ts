import { placeRefIdentity } from '@doppler-group/twinfile-core/ref';

import type { Story } from '../types/story-narrative.js';

export type ValidateStoryScenesResult = { ok: true } | { ok: false; issues: string[] };

export function validateStoryNarrativeScenes(story: Story): ValidateStoryScenesResult {
  const scenes = story.scenes;
  if (!scenes?.length) {
    return { ok: true };
  }

  const issues: string[] = [];
  const cast = new Set(story.characters.map((row) => row.characterId));
  const placeIds = new Set((story.places ?? []).map((row) => placeRefIdentity(row.placeRef)));
  const sceneIds = new Set<string>();

  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) {
      issues.push(`duplicate scene id "${scene.id}"`);
    }
    sceneIds.add(scene.id);

    if (!placeIds.has(placeRefIdentity(scene.placeRef))) {
      issues.push(`scene ${scene.id} placeRef "${scene.placeRef}" is not listed on story.places`);
    }

    for (const characterId of scene.characterIds) {
      if (!cast.has(characterId)) {
        issues.push(`scene ${scene.id} character "${characterId}" is not listed on story.characters`);
      }
    }

    for (const beat of scene.cast ?? []) {
      if (!scene.characterIds.includes(beat.characterId)) {
        issues.push(`scene ${scene.id} cast beat characterId "${beat.characterId}" is not in characterIds`);
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
