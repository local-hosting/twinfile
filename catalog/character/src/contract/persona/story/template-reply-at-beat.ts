import type { PcmStoryPsychology } from './pcm-story-psychology.js';

export type PcmStoryBeatContext = {
  isoDate: string;
  hourOfDay: number;
  touchpointId?: string;
  journeyPhaseId?: string;
  label?: string;
  kind?: string;
};

export function templateReplyFromPcmAtBeat(
  psychology: PcmStoryPsychology,
  beat: PcmStoryBeatContext,
  message: string,
): string {
  const trimmed = message.trim();
  const name = psychology.displayName?.trim() || psychology.pcmId;
  const mindset = psychology.mindset?.trim();
  const scene = beat.label ?? beat.touchpointId ?? beat.kind ?? 'the day';
  const opener = mindset ? `${name} (${mindset})` : name;
  return `${opener} at ${beat.isoDate} hour ${beat.hourOfDay} — during ${scene}: I hear you saying "${trimmed}".`;
}
