import {
  resolveJourneyForPersona,
  type Journey,
  type PCM,
} from '@doppler-group/twinfile-character/pcm';

import type { SAMCharacterContext } from '../types/sam-character-context.js';

export function resolveJourneyFromCharacterContext(
  context: SAMCharacterContext,
): Journey | undefined {
  if (context.journey) {
    return context.journey;
  }
  const journeyId = context.journeyId?.trim();
  if (!journeyId) {
    return undefined;
  }

  const focalPcm = resolvePcmForCharacter(context);
  if (focalPcm) {
    return resolveJourneyForPersona(focalPcm, journeyId, context.focalPcmId);
  }

  return undefined;
}

export function resolvePcmForCharacter(context: SAMCharacterContext): PCM | undefined {
  const direct = context.pcmById?.[context.focalPcmId];
  if (direct) {
    return direct;
  }
  return Object.values(context.pcmById ?? {}).find(
    (pcm) => pcm.persona.id === context.focalPcmId || pcm.id === context.focalPcmId,
  );
}
