import type { Character } from '@local-hosting/twinfile-character/character';
import type { StoryBriefCharacterV1, StoryBriefSnapshotV1 } from './types.js';

function humanizeToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function humanizeStoryWireLabel(raw: string | undefined): string {
  const id = raw?.trim();
  if (!id) return '';
  let leaf = id.includes(':') ? id.split(':').pop() ?? id : id;
  leaf = leaf.replace(/^(rider|driver|guest|shopper)-/i, '');
  return humanizeToken(leaf);
}

/** Storage keys and instance slugs — not cast-facing names. */
export function isTechnicalStoryIdentityLabel(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('persona:')) return false;
  if (trimmed.startsWith('did:')) return true;
  if (/^[a-z0-9]+(-[a-z0-9]+){2,}$/i.test(trimmed)) return true;
  if (/^(rider|driver|character|story)-/i.test(trimmed)) return true;
  if (!trimmed.includes(' ') && trimmed.includes('-') && trimmed === trimmed.toLowerCase()) {
    return true;
  }
  return false;
}

function exemplarNameFromCharacter(character: Character | undefined): string | undefined {
  const name = character?.persona.exemplar?.name?.trim();
  return name || undefined;
}

function personaLabelFromCharacter(character: Character | undefined): string | undefined {
  const label = character?.persona.label?.trim();
  if (!label || isTechnicalStoryIdentityLabel(label)) return undefined;
  return label;
}

export function resolveHumanProtagonistName(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  personaLabel?: string;
}): string {
  const { snapshot, character, personaLabel } = input;
  const candidates = [character?.name?.trim(), snapshot.who?.displayName?.trim(), personaLabel?.trim()];
  for (const candidate of candidates) {
    if (candidate && !isTechnicalStoryIdentityLabel(candidate)) {
      return candidate;
    }
  }
  const psychologyCharacterId =
    snapshot.who?.characterId?.trim() || character?.psychology?.characterId?.trim();
  if (psychologyCharacterId) {
    const fromPsychologyId = humanizeStoryWireLabel(psychologyCharacterId);
    if (fromPsychologyId) return fromPsychologyId;
  }
  const characterId = snapshot.characterId?.trim() || character?.characterId?.trim();
  if (characterId && !isTechnicalStoryIdentityLabel(characterId)) {
    return humanizeStoryWireLabel(characterId) || characterId;
  }
  const storyId = snapshot.storyId?.trim();
  if (storyId) {
    return humanizeToken(storyId) || 'Our protagonist';
  }
  return 'Our protagonist';
}

export function resolveHumanProtagonistNameWithCharacter(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  focalCharacter?: Character;
  personaLabel?: string;
}): string {
  const fromExemplar = exemplarNameFromCharacter(input.focalCharacter);
  if (fromExemplar) return fromExemplar;
  const fromLabel = personaLabelFromCharacter(input.focalCharacter) ?? input.personaLabel?.trim();
  if (fromLabel && !isTechnicalStoryIdentityLabel(fromLabel)) {
    return fromLabel;
  }
  const base = resolveHumanProtagonistName(input);
  if (!isTechnicalStoryIdentityLabel(base)) {
    return base;
  }
  const characterId = input.focalCharacter?.id?.trim() || input.snapshot.who?.characterId?.trim();
  if (characterId) {
    return humanizeStoryWireLabel(characterId) || base;
  }
  const storyId = input.snapshot.storyId?.trim();
  if (storyId) {
    return humanizeToken(storyId) || base;
  }
  return base;
}

export function formatProtagonistInstanceCredits(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
}): string | undefined {
  const storyId = input.snapshot.storyId?.trim();
  const characterId = input.snapshot.characterId?.trim() || input.character?.characterId?.trim();
  const psychologyCharacterId =
    input.snapshot.who?.characterId?.trim() || input.character?.psychology?.characterId?.trim();
  const bits: string[] = [];
  if (storyId && isTechnicalStoryIdentityLabel(storyId)) {
    bits.push(`project instance \`${storyId}\``);
  }
  if (characterId && characterId !== storyId && isTechnicalStoryIdentityLabel(characterId)) {
    bits.push(`catalog id \`${characterId}\``);
  }
  if (psychologyCharacterId) {
    bits.push(`org Character \`${psychologyCharacterId}\``);
  }
  if (bits.length === 0) return undefined;
  return bits.join(' · ');
}

export function buildProtagonistWhoBlurbLines(input: {
  name: string;
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  storyPitch?: string;
}): string[] {
  const lines: string[] = [];
  const credits = formatProtagonistInstanceCredits({
    snapshot: input.snapshot,
    character: input.character,
  });
  if (credits) {
    lines.push(`${input.name} is the focal character for this episode (${credits}).`);
  } else {
    lines.push(`${input.name} is the focal character for this episode.`);
  }
  const pitch = input.storyPitch?.trim() || input.snapshot.storyPitch?.trim();
  const goals = (input.personaGoals ?? []).map((g) => g.trim()).filter(Boolean).slice(0, 2);
  const frustrations = (input.personaFrustrations ?? [])
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 1);
  if (pitch) {
    lines.push(pitch.endsWith('.') ? pitch : `${pitch}.`);
  } else if (goals.length > 0) {
    lines.push(`She wants ${goals.join('; ').toLowerCase()}.`);
  }
  if (input.personaQuote?.trim()) {
    lines.push(`“${input.personaQuote.trim()}”`);
  } else if (frustrations.length > 0) {
    lines.push(`What gets in her way: ${frustrations[0]}.`);
  }
  return lines.slice(0, 3);
}
