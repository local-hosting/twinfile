import type { Journey } from '@local-hosting/twinfile-character/character';
import { placeRefIdentity } from '@local-hosting/twinfile-core/ref';

import type { Story } from '../types/story-narrative.js';

export type ValidateStoryAssociationsResult =
  | { ok: true }
  | { ok: false; issues: string[] };

export function validateStoryNarrativeAssociations(
  story: Story,
  context?: {
    journey?: Journey;
    knownCharacterIds?: readonly string[];
    knownPlaceRefs?: readonly string[];
  },
): ValidateStoryAssociationsResult {
  const issues: string[] = [];
  const characters = story.characters;

  if (characters.length < 1) {
    issues.push('characters requires at least one characterId');
  }

  const characterIds = new Set(characters.map((row) => row.characterId));
  if (!characterIds.has(story.binding.characterId)) {
    issues.push(
      `binding.characterId (${story.binding.characterId}) must appear in characters`,
    );
  }

  const primaryIds = characters.filter((row) => row.primary).map((row) => row.characterId);
  if (primaryIds.length > 1) {
    issues.push(`characters has multiple primary: ${primaryIds.join(', ')}`);
  }

  if (context?.knownCharacterIds?.length) {
    const known = new Set(context.knownCharacterIds);
    for (const characterId of characterIds) {
      if (!known.has(characterId)) {
        issues.push(`unknown characterId "${characterId}" (not in mounted Character catalog)`);
      }
    }
  }

  if (context?.knownPlaceRefs?.length && story.places?.length) {
    const known = new Set(context.knownPlaceRefs.map(placeRefIdentity));
    for (const place of story.places) {
      if (!known.has(placeRefIdentity(place.placeRef))) {
        issues.push(`unknown placeRef "${place.placeRef}" (not in mounted place catalog)`);
      }
    }
  }

  const journey = context?.journey;
  const journeyId = story.binding.journeyId;
  if (journeyId && journey && journey.id !== journeyId) {
    issues.push(
      `binding.journeyId (${journeyId}) does not match journey.id (${journey.id})`,
    );
  }

  if (journey && journey.characterId !== story.binding.characterId) {
    issues.push(
      `journey.characterId (${journey.characterId}) must match binding.characterId (${story.binding.characterId})`,
    );
  }

  if (journey && !characterIds.has(journey.characterId)) {
    issues.push(
      `journey.characterId (${journey.characterId}) must appear in characters`,
    );
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
