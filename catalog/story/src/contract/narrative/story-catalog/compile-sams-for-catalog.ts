import type { PCM } from '@local-hosting/twinfile-character/pcm';
import type { PlaceMount } from '../types/place-mount.js';

import { compileSAM } from '../contract/compile-sam.js';
import type { SAM } from '../types/sam.js';
import type { SAMCharacterContext } from '../types/sam-character-context.js';
import { resolveJourneyForSam } from '../journey/build/resolve-journey-for-sam.js';

function pcmForBinding(pcms: readonly PCM[], pcmId: string): PCM {
  const row = pcms.find((pcm) => pcm.id === pcmId || pcm.persona.id === pcmId);
  if (!row) {
    throw new Error(`SAM binding pcmId "${pcmId}" is not in mounted PCM catalog`);
  }
  return row;
}

export function compileSamsForCatalog(input: {
  pcms: readonly PCM[];
  placeMounts: readonly PlaceMount[];
  sams: readonly SAM[];
}): SAM[] {
  const knownPcmIds = input.pcms.map((row) => row.persona.id);
  const knownVenueKeys = input.placeMounts.map((row) => row.venueKey);
  const pcmById: Record<string, PCM> = {};
  for (const pcm of input.pcms) {
    pcmById[pcm.id] = pcm;
    pcmById[pcm.persona.id] = pcm;
  }

  return input.sams.map((sam) => {
    const focalPcm = pcmForBinding(input.pcms, sam.binding.pcmId);
    const journey = resolveJourneyForSam(sam, focalPcm.journeys ?? []);
    const characterContext: SAMCharacterContext = {
      focalPcmId: focalPcm.persona.id,
      journeyId: journey.id,
      journey,
      pcmById,
    };

    const compiled = compileSAM({
      sam,
      journey,
      placeMounts: input.placeMounts,
      characterContext,
      knownPcmIds,
      knownVenueKeys,
      force: true,
    });

    if (!compiled.ok) {
      throw new Error(`compileSAM failed for ${sam.id}: ${compiled.issues.join('; ')}`);
    }
    if (!compiled.sam.episodeArc) {
      throw new Error(`compileSAM succeeded for ${sam.id} but episodeArc is missing`);
    }

    return compiled.sam;
  });
}
