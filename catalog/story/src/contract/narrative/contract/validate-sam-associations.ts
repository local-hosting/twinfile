import type { Journey } from '@local-hosting/twinfile-character/pcm';
import { placeRefIdentity } from '@local-hosting/twinfile-core/ref';

import type { SAM } from '../types/sam.js';

export type ValidateSAMAssociationsResult =
  | { ok: true }
  | { ok: false; issues: string[] };

export function validateSAMAssociations(
  sam: SAM,
  context?: {
    journey?: Journey;
    knownPcmIds?: readonly string[];
    knownPlaceRefs?: readonly string[];
  },
): ValidateSAMAssociationsResult {
  const issues: string[] = [];
  const characters = sam.characters;

  if (characters.length < 1) {
    issues.push('characters requires at least one pcmId');
  }

  const pcmIds = new Set(characters.map((row) => row.pcmId));
  if (!pcmIds.has(sam.binding.pcmId)) {
    issues.push(
      `binding.pcmId (${sam.binding.pcmId}) must appear in characters`,
    );
  }

  const primaryIds = characters.filter((row) => row.primary).map((row) => row.pcmId);
  if (primaryIds.length > 1) {
    issues.push(`characters has multiple primary: ${primaryIds.join(', ')}`);
  }

  if (context?.knownPcmIds?.length) {
    const known = new Set(context.knownPcmIds);
    for (const pcmId of pcmIds) {
      if (!known.has(pcmId)) {
        issues.push(`unknown pcmId "${pcmId}" (not in mounted PCM catalog)`);
      }
    }
  }

  if (context?.knownPlaceRefs?.length && sam.places?.length) {
    const known = new Set(context.knownPlaceRefs.map(placeRefIdentity));
    for (const place of sam.places) {
      if (!known.has(placeRefIdentity(place.placeRef))) {
        issues.push(`unknown placeRef "${place.placeRef}" (not in mounted place catalog)`);
      }
    }
  }

  const journey = context?.journey;
  const journeyId = sam.binding.journeyId;
  if (journeyId && journey && journey.id !== journeyId) {
    issues.push(
      `binding.journeyId (${journeyId}) does not match journey.id (${journey.id})`,
    );
  }

  if (journey && journey.personaId !== sam.binding.pcmId) {
    issues.push(
      `journey.personaId (${journey.personaId}) must match binding.pcmId (${sam.binding.pcmId})`,
    );
  }

  if (journey && !pcmIds.has(journey.personaId)) {
    issues.push(
      `journey.personaId (${journey.personaId}) must appear in characters`,
    );
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
