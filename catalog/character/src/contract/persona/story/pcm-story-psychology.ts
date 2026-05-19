import type { PcmStoryInstance } from '../types/story/pcm-story-instance.js';

/** Cognition-facing slice of a materialized PCM story instance (portable, no host contract). */
export type PcmStoryPsychology = {
  pcmId: string;
  segmentId: string;
  displayName: string;
  mindset?: string;
  traits?: readonly string[];
  voiceLine?: string;
  demographics?: Readonly<Record<string, string>>;
};

export function psychologyFromPcmStoryInstance(instance: PcmStoryInstance): PcmStoryPsychology {
  const { characteristics } = instance;
  return {
    pcmId: instance.pcmId,
    segmentId: instance.segmentId,
    displayName: instance.displayName,
    ...(characteristics.mindset ? { mindset: characteristics.mindset } : {}),
    ...(characteristics.traits?.length ? { traits: [...characteristics.traits] } : {}),
    ...(characteristics.voiceLine ? { voiceLine: characteristics.voiceLine } : {}),
    ...(characteristics.demographics && Object.keys(characteristics.demographics).length
      ? { demographics: { ...characteristics.demographics } }
      : {}),
  };
}
