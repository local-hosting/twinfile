import type { Journey, PCM } from '@local-hosting/twinfile-character/pcm';

import { resolveJourneyForSam } from '../journey/build/resolve-journey-for-sam.js';
import type { SAM } from '../types/sam.js';

export type ResolveSamEpisodeSelection = {
  episodeId?: string;
  pcmId?: string;
};

export type SamEpisodeMountV1 = {
  sam: SAM;
  focalPcm: PCM;
  journey: Journey;
  pcmById: Record<string, PCM>;
};

function pcmByIdMap(pcms: readonly PCM[]): Record<string, PCM> {
  const map: Record<string, PCM> = {};
  for (const pcm of pcms) {
    map[pcm.id] = pcm;
    map[pcm.persona.id] = pcm;
  }
  return map;
}

export function resolveSamEpisode(input: {
  sams: readonly SAM[];
  pcms: readonly PCM[];
  selection: ResolveSamEpisodeSelection;
}): SamEpisodeMountV1 {
  const episodeId = input.selection.episodeId?.trim();
  if (episodeId) {
    const direct = input.sams.find((row) => row.id === episodeId);
    if (!direct) {
      throw new Error(`SAM episode "${episodeId}" is not in mounted catalog`);
    }
    return mountSamEpisode(direct, input.pcms, input.selection.pcmId);
  }

  if (input.sams.length === 1) {
    return mountSamEpisode(input.sams[0], input.pcms, input.selection.pcmId);
  }

  const pcmId = input.selection.pcmId?.trim();
  if (pcmId) {
    const forPcm = input.sams.filter((row) => row.binding.pcmId === pcmId);
    if (forPcm.length === 1) {
      return mountSamEpisode(forPcm[0], input.pcms, pcmId);
    }
    if (forPcm.length > 1) {
      throw new Error(`Multiple SAM episodes for PCM "${pcmId}" — pass episodeId`);
    }
  }

  throw new Error('Could not resolve SAM episode — pass episodeId or pcmId');
}

function mountSamEpisode(
  sam: SAM,
  pcms: readonly PCM[],
  pcmIdOverride?: string,
): SamEpisodeMountV1 {
  const pcmById = pcmByIdMap(pcms);
  const focalPcmId = pcmIdOverride?.trim() || sam.binding.pcmId;
  const focalPcm = pcmById[focalPcmId];
  if (!focalPcm) {
    throw new Error(`PCM "${focalPcmId}" is not in mounted catalog`);
  }

  const journey = resolveJourneyForSam(sam, focalPcm.journeys ?? []);
  return { sam, focalPcm, journey, pcmById };
}
