import type { CharacterStoryPsychology } from './character-story-psychology.js';

export type CharacterStoryBeatContext = {
  isoDate: string;
  hourOfDay: number;
  touchpointId?: string;
  journeyPhaseId?: string;
  label?: string;
  kind?: string;
};

export function templateReplyFromCharacterAtBeat(
  psychology: CharacterStoryPsychology,
  beat: CharacterStoryBeatContext,
  message: string,
): string {
  const trimmed = message.trim();
  const name = psychology.displayName?.trim() || psychology.characterId;
  const mindset = psychology.mindset?.trim();
  const scene = beat.label ?? beat.touchpointId ?? beat.kind ?? 'the day';
  const opener = mindset ? `${name} (${mindset})` : name;
  return `${opener} at ${beat.isoDate} hour ${beat.hourOfDay} — during ${scene}: I hear you saying "${trimmed}".`;
}
